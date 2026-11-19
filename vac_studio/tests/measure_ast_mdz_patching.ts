/**
 * Video-as-Code Studio - AST MDZ Local Accurate Patching & Zero Format Pollution Benchmark
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.3.1, §8.3 TC-AST-01 & WBS-1.7/1.8
 *
 * SPECIFICATION (TC-AST-01 验收条款):
 * 1. 托管声明区 (MDZ) 局部属性替换: Scene01 durationInFrames 从 270 精准修改为 285;
 * 2. 差异检测严格单行: git diff 严格仅有 1 处数值变动 (1 line added, 1 line deleted);
 * 3. 零格式污染: 非托管代码区的自定义注释 (// NOTE: Critical complex hook)、缩进、空行 100% 字节保真;
 * 4. 严禁全文 Prettier 重新格式化污染.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AstMdzPatchSummary {
  testCaseId: 'TC-AST-01';
  standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.3.1 & §8.3)';
  evaluatedAt: string;
  workload: {
    targetFile: string;
    targetSceneId: string;
    mutationType: 'SCENE_DURATION_INCREMENT';
    fromFrames: number;
    toFrames: number;
  };
  metrics: {
    gitDiffAddedLines: number;
    gitDiffDeletedLines: number;
    isStrictSingleLineDiff: boolean;
    nonTargetLinesHashMatch: boolean;
    commentIntegrityPercent: number;
    cstTriviaPreserved: boolean;
    zeroFormatPollution: boolean;
    reparseValidated: boolean;
    rawGitDiff: string;
  };
  verdict: 'PASSED' | 'FAILED';
  failureReason?: string;
}

export async function runAstMdzPatchBenchmark(): Promise<AstMdzPatchSummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M1.2 GATE: MDZ LOCAL ACCURATE AST PATCHING & ZERO FORMAT POLLUTION (TC-AST-01)');
  console.log('Criteria: Git diff strictly 1 numerical value change | 100% CST trivia preservation');
  console.log('='.repeat(80));

  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const templatePath = path.join(fixturesDir, 'ast_sample_act1.tsx');
  const stagingPath = path.join(fixturesDir, 'ast_sample_act1.staged.tsx');

  // Copy template fixture to staging area for isolated diff analysis
  fs.copyFileSync(templatePath, stagingPath);
  const originalContent = fs.readFileSync(templatePath, 'utf-8');

  // 1. Invoke AST Engine Emitter (To be plugged in WBS-1.8 implementation)
  let actualCommittedValue = -1;
  let stagedContent = originalContent;
  let engineLoaded = false;

  try {
    const astEngine = await import('../server/ast_engine/emitter.js').catch(() => null);
    if (astEngine && typeof astEngine.patchSequenceDuration === 'function') {
      await astEngine.patchSequenceDuration(stagingPath, 'Scene01', 285);
      stagedContent = fs.readFileSync(stagingPath, 'utf-8');
      actualCommittedValue = 285;
      engineLoaded = true;
    } else {
      console.log('[SKELETON-AUDIT] AST Engine emitter hook registered. Pending engine implementation.');
    }
  } catch (err: any) {
    console.warn('[AST-PATCH-WARN]', err.message);
  }

  // 2. Measure Git Diff & Line Changes
  let addedLines = 0;
  let deletedLines = 0;
  let rawGitDiff = '';
  try {
    const numstatOutput = execSync(`git diff --no-index --numstat "${templatePath}" "${stagingPath}"`, {
      encoding: 'utf-8'
    }).trim();
    if (numstatOutput) {
      const parts = numstatOutput.split('\t');
      addedLines = parseInt(parts[0], 10) || 0;
      deletedLines = parseInt(parts[1], 10) || 0;
    }
    rawGitDiff = execSync(`git diff --no-index -U0 "${templatePath}" "${stagingPath}"`, {
      encoding: 'utf-8'
    }).trim();
  } catch (err: any) {
    if (err.stdout) {
      const lines = err.stdout.trim().split('\n');
      rawGitDiff = err.stdout.trim();
      // Parse numstat if error thrown by non-zero git diff exit
      try {
        const numstat = execSync(`git diff --no-index --numstat "${templatePath}" "${stagingPath}"`, {
          encoding: 'utf-8'
        }).trim();
        const parts = numstat.split('\t');
        addedLines = parseInt(parts[0], 10) || 0;
        deletedLines = parseInt(parts[1], 10) || 0;
      } catch (numErr: any) {
        if (numErr.stdout) {
          const parts = numErr.stdout.trim().split('\t');
          addedLines = parseInt(parts[0], 10) || 0;
          deletedLines = parseInt(parts[1], 10) || 0;
        }
      }
    }
  }

  // 3. Verify CST Trivia & Comment Preservation
  const criticalComment = '// NOTE: Critical complex hook - DO NOT TOUCH OR REFORMAT';
  const hasCriticalComment = stagedContent.includes(criticalComment);
  const bitwiseCode = 'return ((x << 2) ^ (y >> 1)) * factor;';
  const hasBitwiseCode = stagedContent.includes(bitwiseCode);

  const commentIntegrity = hasCriticalComment && hasBitwiseCode ? 100 : 0;
  const isStrictSingleLineDiff = addedLines === 1 && deletedLines === 1;

  // 4. Non-target lines byte-level integrity check (Excluding modified line)
  const origLines = originalContent.split(/\r?\n/);
  const stagedLines = stagedContent.split(/\r?\n/);
  let nonTargetLinesMatch = false;

  if (origLines.length === stagedLines.length && origLines.length > 0) {
    const origFiltered = origLines.filter((l) => !l.includes('durationInFrames'));
    const stagedFiltered = stagedLines.filter((l) => !l.includes('durationInFrames'));
    const origHash = crypto.createHash('sha256').update(origFiltered.join('\n')).digest('hex');
    const stagedHash = crypto.createHash('sha256').update(stagedFiltered.join('\n')).digest('hex');
    nonTargetLinesMatch = origHash === stagedHash;
  }

  const zeroFormatPollution = isStrictSingleLineDiff && commentIntegrity === 100 && nonTargetLinesMatch;
  const reparseValidated = actualCommittedValue === 285 && stagedContent.includes('durationInFrames={285}');

  let passed = isStrictSingleLineDiff && zeroFormatPollution && reparseValidated;
  let failureReason: string | undefined;

  if (!engineLoaded) {
    passed = false;
    failureReason = 'SKELETON_AUDIT_MODE: AST Engine Emitter not yet implemented (Pending WBS-1.8)';
  } else if (!isStrictSingleLineDiff) {
    passed = false;
    failureReason = `Diff violation: added=${addedLines}, deleted=${deletedLines} (Expected strictly 1 add, 1 del)`;
  } else if (!zeroFormatPollution) {
    passed = false;
    failureReason = 'Format pollution detected: non-target lines or CST trivia was modified';
  }

  const summary: AstMdzPatchSummary = {
    testCaseId: 'TC-AST-01',
    standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.3.1 & §8.3)',
    evaluatedAt: new Date().toISOString(),
    workload: {
      targetFile: 'fixtures/ast_sample_act1.tsx',
      targetSceneId: 'Scene01',
      mutationType: 'SCENE_DURATION_INCREMENT',
      fromFrames: 270,
      toFrames: 285
    },
    metrics: {
      gitDiffAddedLines: addedLines,
      gitDiffDeletedLines: deletedLines,
      isStrictSingleLineDiff,
      nonTargetLinesHashMatch: nonTargetLinesMatch,
      commentIntegrityPercent: commentIntegrity,
      cstTriviaPreserved: commentIntegrity === 100,
      zeroFormatPollution,
      reparseValidated,
      rawGitDiff
    },
    verdict: passed ? 'PASSED' : 'FAILED',
    failureReason
  };

  // Clean staging file
  if (fs.existsSync(stagingPath)) {
    try {
      fs.unlinkSync(stagingPath);
    } catch {}
  }

  const outDirs = [
    path.resolve(__dirname, '..', '..', 'tests', 'm1_2_gate'),
    path.resolve(__dirname, 'm1_2_gate')
  ];

  for (const dir of outDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'ast_mdz_patching_summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  }

  console.log(`\n[TC-AST-01 METRICS]`);
  console.log(`  -> Git Diff Added Lines   : ${addedLines} (Budget: 1)`);
  console.log(`  -> Git Diff Deleted Lines : ${deletedLines} (Budget: 1)`);
  console.log(`  -> Single Line Difference : ${isStrictSingleLineDiff ? 'YES' : 'NO'}`);
  console.log(`  -> Non-Target Lines Hash  : ${nonTargetLinesMatch ? 'MATCH' : 'MISMATCH'}`);
  console.log(`  -> Comment & Trivia Guard : ${commentIntegrity}%`);
  console.log(`  -> Zero Format Pollution  : ${zeroFormatPollution ? 'VERIFIED' : 'FAILED'}`);
  console.log(`  -> Reparse Validated      : ${reparseValidated ? 'YES' : 'NO'}`);
  console.log(`\nTC-AST-01 VERDICT: ${summary.verdict} ${failureReason ? `(${failureReason})` : ''}`);

  return summary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runAstMdzPatchBenchmark()
    .then((s) => {
      if (s.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[TC-AST-01-FATAL]', err);
      process.exit(1);
    });
}
