import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/site-worker.js';
import {createFirebaseAuthMock} from './firebase-auth-mock.mjs';

class Statement {
  constructor(database, sql) { this.statement = database.prepare(sql); }
  bind(...values) { this.values = values; return this; }
  async first() { return this.statement.get(...(this.values || [])) || null; }
  async all() { return { results: this.statement.all(...(this.values || [])) }; }
  async run() { const result = this.statement.run(...(this.values || [])); return { meta: { changes: Number(result.changes) } }; }
}

class D1 {
  constructor(database) { this.database = database; }
  prepare(sql) { return new Statement(this.database, sql); }
  async batch(statements) {
    this.database.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
for (const file of [
  'drizzle/0000_medexam.sql',
  'drizzle/0001_academic_hierarchy.sql',
  'drizzle/0002_backfill_existing_tests.sql',
  'drizzle/0003_scale_indexes.sql',
  'drizzle/0004_attempt_shuffle.sql',
  'drizzle/0005_security_hardening.sql',
  'drizzle/0006_accounts_organizations_permissions.sql',
  'drizzle/0007_exam_modes_question_types_files.sql',
  'drizzle/0008_staff_titles_and_college_copy.sql',
  'drizzle/0009_clinical_glimpses_library_logs.sql',
  'drizzle/0010_student_bans.sql',
  'drizzle/0011_security_hardening.sql',
  'drizzle/0012_firebase_auth.sql',
  'drizzle/0013_academic_trash_and_notifications.sql',
  'drizzle/0014_media_access_indexes.sql',
  'drizzle/0015_google_auth_flows.sql',
  'drizzle/0016_auth_session_epoch.sql',
  'drizzle/0017_academic_change_requests.sql'
]) {
  sqlite.exec(await readFile(file, 'utf8'));
}

const firebase = createFirebaseAuthMock();
const env = {
  DB: new D1(sqlite),
  OWNER_EMAILS: 'spoof-target@kiur.test,real-owner@kiur.test',
  OWNER_PROVISIONING_SECRET: 'owner-provisioning-secret-minimum-32-chars!',
  PASSWORD_PEPPER: 'test-password-pepper-32-characters-long',
  DEVICE_HASH_PEPPER: 'test-device-pepper-32-characters-long',
  FIREBASE_AUTH: firebase.api
};
const base = 'https://example.test';
function headers(extra = {}) {
  return { 'content-type': 'application/json', origin: base, 'sec-fetch-site': 'same-origin', ...extra };
}
async function call(path, { method = 'GET', body, extraHeaders = {} } = {}) {
  const response = await worker.fetch(new Request(base + path, {
    method,
    headers: headers(extraHeaders),
    body: body === undefined ? undefined : JSON.stringify(body)
  }), env);
  let data = null;
  if (response.status !== 204) data = await response.json();
  return { response, data };
}

// 1. Non-existent owner login attempt must fail with unified 401 INVALID_CREDENTIALS and NEVER create an account
const nonExistentLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'nonexistent-owner@kiur.test', password: 'Password12345678!' }
});
assert.equal(nonExistentLogin.response.status, 401, 'Non-existent owner login must return 401');
assert.equal(nonExistentLogin.data?.error?.code, 'INVALID_CREDENTIALS', 'Must return INVALID_CREDENTIALS');
assert.equal(nonExistentLogin.data?.error?.message, 'البريد أو كلمة المرور غير صحيحة');
const ownerUserCount = sqlite.prepare(`SELECT count(*) AS count FROM users WHERE email='nonexistent-owner@kiur.test'`).get().count;
assert.equal(ownerUserCount, 0, 'Login must NEVER auto-provision an owner account');

// 2. Empty password hash in DB must NEVER allow login or overwrite password
sqlite.prepare(`
  INSERT INTO users(id, email, name, role, account_role, account_status, auth_provider, password_hash, password_salt, password_iterations, password_peppered)
  VALUES('empty-hash-user', 'emptyhash@kiur.test', 'مستخدم فارغ', 'student', 'student', 'active', 'password', NULL, NULL, NULL, 0)
`).run();
const emptyHashLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'emptyhash@kiur.test', password: 'AnyPassword12345678!' }
});
assert.equal(emptyHashLogin.response.status, 401, 'User with NULL password hash must fail login');
const userAfter = sqlite.prepare(`SELECT password_hash FROM users WHERE id='empty-hash-user'`).get();
assert.equal(userAfter.password_hash, null, 'Login must NEVER overwrite password_hash');

// 3. Student with owner email: login must NEVER promote to owner
sqlite.prepare(`
  INSERT INTO users(id, email, name, role, account_role, account_status, auth_provider, firebase_uid, email_verified_at)
  VALUES('student-with-owner-email', 'spoof-target@kiur.test', 'طالب انتحالي', 'student', 'student', 'active', 'password', 'uid-owner-spoof', CURRENT_TIMESTAMP)
`).run();
sqlite.prepare(`
  INSERT INTO user_identities(provider, provider_user_id, user_id, email)
  VALUES('password', 'uid-owner-spoof', 'student-with-owner-email', 'spoof-target@kiur.test')
`).run();
await firebase.api.signUp({ email: 'spoof-target@kiur.test', password: 'ValidStudentPass2026!' });
firebase.verify('spoof-target@kiur.test');

const spoofLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'spoof-target@kiur.test', password: 'ValidStudentPass2026!' }
});
assert.equal(spoofLogin.response.status, 200, 'Legitimate student credentials can log in');
assert.equal(spoofLogin.data?.user?.role, 'student', 'Student with owner email must NOT be promoted to owner on login');
const roleInDb = sqlite.prepare(`SELECT role, account_role FROM users WHERE id='student-with-owner-email'`).get();
assert.equal(roleInDb.role, 'student');
assert.equal(roleInDb.account_role, 'student');

// 4. Firebase unavailable during login must return 503 and never fall back to local bypass
const origApi = env.FIREBASE_AUTH;
delete env.FIREBASE_AUTH;
const fbDownLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'emptyhash@kiur.test', password: 'ValidStudentPass2026!' }
});
assert.equal(fbDownLogin.response.status, 503, 'Firebase outage must return 503');
assert.equal(fbDownLogin.data?.error?.code, 'FIREBASE_AUTH_UNAVAILABLE');
env.FIREBASE_AUTH = origApi;

// 5. Clean DB of existing seed owners to test fresh initial owner provisioning
sqlite.prepare(`DELETE FROM users WHERE account_role='owner'`).run();

// 5a. Incorrect secret token returns 404 (inert endpoint)
const badSecretProvision = await call('/api/auth/provision-owner', {
  method: 'POST',
  extraHeaders: { 'x-kiur-owner-setup-token': 'wrong-secret-token-at-least-32-chars!' },
  body: { email: 'real-owner@kiur.test', password: 'OwnerSecurePass20262026!', name: 'المالك الفعلي' }
});
assert.equal(badSecretProvision.response.status, 404, 'Bad secret token must return 404');

// 5b. Valid secret token provisions owner successfully
const validProvision = await call('/api/auth/provision-owner', {
  method: 'POST',
  extraHeaders: { 'x-kiur-owner-setup-token': env.OWNER_PROVISIONING_SECRET },
  body: { email: 'real-owner@kiur.test', password: 'OwnerSecurePass20262026!', name: 'المالك الفعلي' }
});
assert.equal(validProvision.response.status, 200, 'Valid owner provisioning must succeed');
assert.equal(validProvision.data?.provisioned, true);

// 5c. Token reuse: second attempt returns 410 (fail-closed, single-use burned)
const reusedProvision = await call('/api/auth/provision-owner', {
  method: 'POST',
  extraHeaders: { 'x-kiur-owner-setup-token': env.OWNER_PROVISIONING_SECRET },
  body: { email: 'another-owner@kiur.test', password: 'OwnerSecurePass20262026!', name: 'مالك آخر' }
});
assert.equal(reusedProvision.response.status, 410, 'Reused provisioning token must return 410');

// 5d. Even with a new token, once an owner exists in D1, provisioning locks permanently (fail-closed)
sqlite.prepare(`DELETE FROM api_rate_limits`).run();
env.OWNER_PROVISIONING_SECRET = 'another-brand-new-secret-token-32-chars!';
const lockedProvision = await call('/api/auth/provision-owner', {
  method: 'POST',
  extraHeaders: { 'x-kiur-owner-setup-token': env.OWNER_PROVISIONING_SECRET },
  body: { email: 'another-owner@kiur.test', password: 'OwnerSecurePass20262026!', name: 'مالك آخر' }
});
assert.equal(lockedProvision.response.status, 410, 'Provisioning must be permanently locked when owner exists');
assert.equal(lockedProvision.data?.error?.code, 'PROVISIONING_LOCKED');

// 6. Owner can now log in safely with provisioned credentials
const ownerLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'real-owner@kiur.test', password: 'OwnerSecurePass20262026!' }
});
assert.equal(ownerLogin.response.status, 200, 'Provisioned owner can log in');
assert.equal(ownerLogin.data?.user?.role, 'owner');

console.log(JSON.stringify({
  ok: true,
  nonExistentOwnerBypassBlocked: true,
  emptyPasswordHashBypassBlocked: true,
  studentOwnerEmailEscalationBlocked: true,
  firebaseOutageReturns503: true,
  ownerProvisioningSingleUse: true,
  ownerProvisioningPermanentlyLocked: true,
  ownerLoginVerified: true
}));
