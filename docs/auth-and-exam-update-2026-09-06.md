# Authentication and exam schedule update — ready for deployment

## Implemented locally

- Explicit formal-exam controls: year, month, day, hour, minute, AM/PM. Display and input use Baghdad UTC+3, storage uses ISO UTC. Invalid calendar dates and missing fields cannot produce an ISO value; native required/min/max validation and existing server exam validation remain.
- New/reset passwords: at least eight ASCII digits and one Unicode letter, length 9–128. Existing passwords remain usable on login; they are not silently changed.
- Catalog loads only on registration, not every login screen.
- Forgot-password preserves delivery feedback. New `mode=resetPassword&oobCode=…` screen submits to rate-limited Firebase REST verification/completion. Completion revokes KIUR sessions and records the existing reset event with `details.phase=completed`. The same custom action page safely applies Firebase `verifyEmail` and `recoverEmail` codes.
- ChatGPT link starts top-level navigation. Proxy-secret validation was NOT removed or weakened.
- Google server-owned Firebase authorization-code flow: one-time DB flow, ten-minute expiry, HttpOnly/Secure/Lax cookie, state hash + Firebase session binding, fixed callback, verified Firebase UID lookup, no email-only linking. New users are pending students; no browser-supplied role is accepted. Existing legacy schema calls Firebase identities `password`, including Google-backed Firebase identities.

## External configuration / unresolved work

### Follow-up inspection on September 6

- Reached the real Firebase project through the user's Brave session. Confirmed Spark (no-cost) plan and Email/Password enabled.
- Enabled Google using public name `KIUR by ERATRANS` and support email `hussein2004810@gmail.com`, without selecting any paid upgrade.
- Added `medexam-iraq-2026.hussein2004810.chatgpt.site` to Firebase authorized domains.
- Firebase password policy remains compatible with KIUR's stronger server-side rule; it does not retain the old twelve-character minimum.
- The custom action URL was entered through Firebase's template editor, but the console preview continued to display the default Firebase handler. Treat the custom action URL as unverified until a newly issued real email is inspected end-to-end after deployment.
- The proposed Sites identity adapter was rejected by the approval system again: runtime opt-in plus URL matching does not itself prove that the edge strips forged identity headers or excludes direct Worker access. The attempted patch was not applied. Existing proxy guard remains intact; no claim of live ChatGPT repair is made.
- Ollama lead/reviewer review ran using the allowlisted models. Its PASS included invented verification and an Origin-header assumption, so the supervisor did not accept it as evidence of transport authentication.

1. ChatGPT backend currently expects `OPENAI_PROXY_SECRET` and a matching proxy header. The available Sites auth documentation describes dispatch-owned identity headers, not that custom secret. Auto-review rejected bypassing the guard based only on hostname. Resolve a documented trusted-proxy integration; do not silently remove the guard.
2. Live Google login, live password-reset email delivery and live ChatGPT session completion have NOT yet been verified. Production environment secrets are masked in the settings response; null secret values do not mean absent configuration.
3. Apply migration `drizzle/0015_google_auth_flows.sql` when publishing. No production migration is performed merely by local tests.

## Verification

- TypeScript compilation and Vite production build passed.
- The complete `npm run test:node` suite passed, and auth extensions are now part of that permanent test command.
- Rebuilt worker asset smoke checks passed; these are not real-device browser or real-provider OAuth tests.
- New tests cover 9-character credentials, bad digit counts, Arabic letter, leap day, invalid dates, noon/midnight, UTC roundtrip; reset invalid policy, one-use code and session revocation; Google CSRF, missing/state-mismatched/expired/replayed flow, verified existing account, pending/suspended students, email collision and unverified identity rejection.

## Ollama usage

The configured free lead/builder/reviewer workflow was used for initial proposals and final review. A final retry completed after an earlier network interruption, but requested supervisor review. The supervisor rejected its unsupported assumptions that D1 hashing meant SHA-1 (the code uses WebCrypto SHA-256), that the requirement was exactly eight digits (it is at least eight), and that OAuth state should use `SameSite=Strict` (the top-level cross-site callback requires `Lax`). Its valid live-provider and sensitive-log checks remain in the release checklist. Model output is not treated as proof of security. No paid model or production data/secret was supplied.

## Primary implementation references

- https://firebase.google.com/docs/reference/rest/auth
- https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/createAuthUri
- https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/signInWithIdp
- Local Sites skill `references/authentication.md` for top-level SIWC navigation and dispatch-owned identity headers.
