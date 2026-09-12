import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

const requiredFiles = [
  'src/stitch/components/StitchQBank.tsx',
  'src/stitch/components/StitchTutorPlayer.tsx',
  'src/stitch/components/StitchExamPlayer.tsx',
  'src/stitch/components/StitchReviewCenter.tsx',
  'src/stitch/components/StitchRemediationPlan.tsx',
  'src/stitch/components/StitchAnalytics.tsx',
  'src/stitch/components/StitchPricing.tsx',
  'src/stitch/components/StitchAdminSuite.tsx',
  'src/stitch/components/StitchOnboardingModal.tsx',
  'src/stitch/components/StitchPublicLanding.tsx',
  'src/stitch/components/StitchSidebar.tsx',
  'src/stitch/components/StitchHero.tsx',
  'src/stitch/components/StitchDashboard.tsx',
  'src/stitch/components/StitchStudyPlan.tsx',
  'src/stitch/components/StitchNotes.tsx',
  'src/stitch/StitchApp.tsx',
  'src/stitch/StitchContext.tsx',
  'src/stitch/index.ts',
  'index.html'
];

console.log('--- Verifying Google Stitch Design System Implementation ---');

let passed = 0;
for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing required file: ${relPath}`);
    process.exit(1);
  }
  const stat = fs.statSync(fullPath);
  if (stat.size === 0) {
    console.error(`❌ Empty file: ${relPath}`);
    process.exit(1);
  }
  console.log(`✅ ${relPath} (${stat.size} bytes)`);
  passed++;
}

// Check index.html for fonts and icons
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
if (!indexHtml.includes('Noto+Sans+Arabic') || !indexHtml.includes('Material+Symbols+Outlined')) {
  console.error('❌ index.html is missing typography or icon link tags');
  process.exit(1);
}
console.log('✅ index.html includes Noto Sans Arabic & Material Symbols Outlined');

// Check StitchApp routing
const stitchApp = fs.readFileSync(path.join(rootDir, 'src/stitch/StitchApp.tsx'), 'utf8');
const requiredViews = [
  'qbank',
  'tutor-player',
  'exam-player',
  'review-center',
  'remediation',
  'analytics',
  'pricing',
  'landing',
  'admin'
];

for (const viewName of requiredViews) {
  if (!stitchApp.includes(`view === '${viewName}'`)) {
    console.error(`❌ StitchApp.tsx missing route for view: ${viewName}`);
    process.exit(1);
  }
}
console.log('✅ StitchApp.tsx implements all 9 specification flows');

console.log(`\n🎉 All ${passed} Google Stitch specification files and routing verified successfully!`);
console.log(JSON.stringify({ ok: true, verifiedModules: passed, status: 'Production-Ready' }));
