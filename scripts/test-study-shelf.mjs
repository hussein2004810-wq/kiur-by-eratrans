import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile, readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as model from '../src/study-shelf-model.ts';
import worker from '../worker/site-worker.js';

const catalog = {subjects: [
  {id:'s1',name:'التخدير العام',phaseId:'p1',sortOrder:2},
  {id:'s2',name:'التخدير العام',phaseId:'p1',sortOrder:1},
  {id:'s3',name:'مادة مرحلة أخرى',phaseId:'p2',sortOrder:1},
], lectures:[
  {id:'l1',name:'تقييم المريض',subjectId:'s1',sortOrder:2},
  {id:'empty',name:'الأدوية السريرية',subjectId:'s1',sortOrder:1},
]};
const base = {id:'t1',title:'إختبار تَقْيِيم المريض',subjectId:'s1',lectureId:'l1',subjectName:'التخدير العام',lectureName:'تقييم المريض',phaseId:'p1',status:'published',durationMinutes:20,passPercentage:60,questionCount:5};
const tests = [base, {...base,id:'draft',status:'draft'}, {...base,id:'archived',status:'archived'}, {...base,id:'t2',subjectId:'s2'}, {...base,id:'other',subjectId:'s3',phaseId:'p2'}];
const history = [
  {id:'a2',testId:'t2',percentage:100,finishedAt:'2026-09-01T10:00:00Z'},
  {id:'a1',testId:'t1',percentage:60,finishedAt:'2026-09-02T10:00:00Z'},
  {id:'a3',testId:'t1',percentage:80,finishedAt:'2026-09-03T10:00:00Z'},
  {id:'unknown',testId:'removed',percentage:100,finishedAt:'2026-09-04T10:00:00Z'},
  {id:'legacy',percentage:99,finishedAt:'2026-09-04T11:00:00Z'},
];
assert.equal(model.normalizeStudySearch('  إِختِبَار  الـتَّخْدِير  '), 'اختبار التخدير');
assert(model.matchesStudySearch('المريض اختبار', base.title));
assert(model.matchesStudySearch('ＣＰＲ', 'CPR review'));
assert(!model.matchesStudySearch('قلب', base.title));
assert(model.matchesStudySearch('الادوية', catalog.lectures[1].name));
assert.equal(model.studyTimestamp('2026-09-04 10:00:00'), Date.parse('2026-09-04T10:00:00Z'));
assert.equal(model.studyTimestamp('2026-09-04T13:00:00+03:00'), Date.parse('2026-09-04T10:00:00Z'));
assert.equal(model.studyTimestamp('invalid'), 0);
const before = JSON.stringify({catalog, tests, history});
const shelf = model.buildStudyShelf(catalog, tests, history, 'p1');
assert.deepEqual(shelf.map(item => item.id), ['s2','s1']);
assert.deepEqual(shelf[1].lectures.map(item => item.id), ['empty','l1']);
assert.equal(shelf[1].tests.length, 1);
assert.equal(shelf[1].latest.percentage, 80);
assert.equal(shelf[0].latest.percentage, 100, 'same-name subjects must not merge scores');
assert.equal(shelf[1].attemptedTests, 1, 'retries must not inflate completed-test count');
assert.equal(JSON.stringify({catalog, tests, history}), before, 'presentation must not mutate API data');
assert.equal(model.buildStudyShelf(catalog, [], [], 'p1').length, 2, 'empty academic subjects remain discoverable');
assert.equal(model.buildStudyShelf(catalog, tests, [], 'missing').length, 0);

// Render the actual TSX with React, without a browser, installing packages, or contacting production.
const require = createRequire(import.meta.url);
function compile(relative, overrides={}) {
  const filename = new URL(relative, import.meta.url);
  const {outputText} = ts.transpileModule(readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
  const module = {exports:{}};
  new Function('require','module','exports',outputText)(name => {
    if(name.endsWith('.css')) return {};
    if(Object.hasOwn(overrides,name)) return overrides[name];
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const share = compile('../src/ShareButton.tsx');
const StudyShelf = compile('../src/StudyShelf.tsx', {'./ShareButton':share,'./study-shelf-model':model}).default;
const props = {catalog,tests:[base],history,user:{role:'student',phaseId:'p1'},search:'',setSearch(){},onClearDirect(){},onStart(){throw new Error('Rendering must never create an attempt');},onChangeProfile(){},notify(){},startingId:null};
const home = renderToStaticMarkup(React.createElement(StudyShelf,props));
assert(home.includes('رفّي الدراسي') && home.includes('فتح المحاضرات'));
assert(home.includes('مساري وطلبات التصحيح'),'The academic path contact entry must be discoverable');
assert(home.includes('آخر نتيجة: 80%') && !home.includes('آخر نتيجة: 100%'));
assert(!home.includes('آخر نتيجة: 99%'));
const direct = renderToStaticMarkup(React.createElement(StudyShelf,{...props,directTarget:{kind:'test',id:'t1'},startingId:'t1'}));
assert(direct.includes('disabled=""') && direct.includes('aria-busy="true"'));
assert(direct.includes('مشاركة الاختبار') && direct.includes('الاختبار المُشارك'));
const missing = renderToStaticMarkup(React.createElement(StudyShelf,{...props,directTarget:{kind:'test',id:'outside'}}));
assert(missing.includes('لا توجد اختبارات متاحة هنا') && !missing.includes(base.title));
const search = renderToStaticMarkup(React.createElement(StudyShelf,{...props,search:'الادوية'}));
assert(search.includes('المحاضرات المطابقة (1)') && search.includes('لم نجد اختبارًا مطابقًا'));
const escaped = renderToStaticMarkup(React.createElement(StudyShelf,{...props,tests:[{...base,title:'<script>alert(1)</script>'}],directTarget:{kind:'test',id:'t1'}}));
assert(escaped.includes('&lt;script&gt;') && !escaped.includes('<script>'));
const many = renderToStaticMarkup(React.createElement(StudyShelf,{...props,tests:Array.from({length:60},(_,i)=>({...base,id:`t${i}`})),search:'المريض'}));
assert.equal((many.match(/class="shelfTest"/g)||[]).length, 24);
assert(many.includes('36 متبقية'));

// Real worker + isolated SQLite: new history identifier must remain strictly per-account.
class Statement {
  constructor(db,sql){this.statement=db.prepare(sql)}
  bind(...values){this.values=values;return this}
  async first(){return this.statement.get(...(this.values||[]))||null}
  async all(){return {results:this.statement.all(...(this.values||[]))}}
  async run(){const result=this.statement.run(...(this.values||[]));return {meta:{changes:Number(result.changes)}}}
}
class D1 {
  constructor(db){this.db=db}
  prepare(sql){return new Statement(this.db,sql)}
  async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results}
}
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
for (const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(file=>file.endsWith('.sql')).sort()) db.exec(await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const env={DB:new D1(db),DEVICE_HASH_PEPPER:'synthetic-local-test-pepper-not-a-production-secret'};
async function call(path,id){return worker.fetch(new Request('https://example.test'+path,{headers:id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':`${id}@example.test`}: {}}),env)}
for(const id of ['shelf-a','shelf-b'])assert.equal((await call('/api/me',id)).status,200);
db.prepare("INSERT INTO attempts(id,user_id,test_id,status,percentage,finished_at) VALUES(?,?,?,'submitted',?,CURRENT_TIMESTAMP)").run('own-attempt','shelf-a','demo-preop',80);
db.prepare("INSERT INTO attempts(id,user_id,test_id,status,percentage,finished_at) VALUES(?,?,?,'submitted',?,CURRENT_TIMESTAMP)").run('foreign-attempt','shelf-b','demo-preop',20);
db.prepare("INSERT INTO attempts(id,user_id,test_id,status) VALUES(?,?,?,'in_progress')").run('unfinished','shelf-a','demo-preop');
assert.equal((await call('/api/me/history')).status,401);
const response = await call('/api/me/history?userId=shelf-b','shelf-a');
assert.equal(response.status,200);
assert.equal(response.headers.get('cache-control'),'no-store');
const own = await response.json();
assert.equal(own.data.length,1);
assert.equal(own.data[0].id,'own-attempt');
assert.equal(own.data[0].testId,'demo-preop');
assert(!JSON.stringify(own).includes('foreign-attempt'));
db.close();
console.log(JSON.stringify({ok:true,modelChecks:true,renderScenarios:6,historyIsolation:true,anonymousBlocked:true,initialTestCards:24}));
