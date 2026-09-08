import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = await Promise.all([
  'src/RealAppV2.tsx',
  'src/AuthScreen.tsx',
  'src/AcademicChangeManager.tsx',
  'src/GuestPortal.tsx',
].map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')));

for (const [index, source] of files.entries()) {
  assert.match(
    source,
    /catalog(?:\?|\.)?\.phases\.find\([^)]*departmentId===departmentId\)\?\.id\|\|''/,
    `academic cascade ${index + 1} must select the first phase for the selected department`,
  );
  assert.doesNotMatch(
    source,
    /departmentId'\)Object\.assign\(next,\{phaseId:''/,
    `academic cascade ${index + 1} must not clear phase without selecting a replacement`,
  );
}

assert.match(files[0], /لم يضف المشرف مراحل لهذا القسم/);
assert.match(files[0], /disabled=\{!phases\.length\}/);
assert.match(files[0], /disabled=\{!path\.phaseId\}/);

console.log('academic cascade contract passed');
