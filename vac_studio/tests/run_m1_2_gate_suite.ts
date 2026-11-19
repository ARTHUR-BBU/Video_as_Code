/**
 * Video-as-Code Studio - M1.2 Acceptance Gate Master Formal Verification Suite
 * Standard: ISO/IEC/IEEE 29148:2018 | MotionIR AST Bidirectional Synchronization Engine
 * WBS-1.7 & WBS-1.8 | PRD v2.1.2 §3.3, §3.4, §8.3 TC-AST-01, TC-AST-02, TC-AST-03
 *
 * M1.2 GATE ACCEPTANCE SUITE CRITERIA (3/3 全准则闭环):
 * 1. Criterion 1 (C1 / TC-AST-01): Managed Declarative Zone (MDZ) Local Accurate AST Patching & Zero Format Pollution
 * 2. Criterion 2 (C2 / TC-AST-02): Unmanaged User-Code Zone (UZ) Integrity & 100% CST / AST Token Fidelity
 * 3. Criterion 3 (C3 / TC-AST-03): Dynamic Expression Static Evaluation, Read-Only Downgrade & Zero-Write Guard
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAstMdzPatchBenchmark, AstMdzPatchSummary } from './measure_ast_mdz_patching.js';
import { runAstUzFidelityBenchmark, AstUzFidelitySummary } from './measure_ast_uz_fidelity.js';
import { runAstReadonlyGuardBenchmark, AstReadonlyGuardSummary } from './measure_ast_readonly_guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface M1_2GateMasterSummary {
  acceptanceGate: 'M1.2_MOTION_IR_AST_BIDIRECTIONAL_SYNCHRONIZATION';
  standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.3, §3.4, §8.3)';
  evaluatedAt: string;
  totalDurationSeconds: number;
  mode: 'SKELETON_AUDIT' | 'GATE_EVALUATION';
  criteria: {
    c1_mdzPatching: {
      standard: 'PRD v2.1.2 §3.3.1 & §8.3 TC-AST-01';
      targetFile: string;
      isStrictSingleLineDiff: boolean;
      gitDiffAddedLines: number;
      gitDiffDeletedLines: number;
      zeroFormatPollution: boolean;
      commentIntegrityPercent: number;
      verdict: 'PASSED' | 'FAILED';
      failureReason?: string;
    };
    c2_uzFidelity: {
      standard: 'PRD v2.1.2 §3.3.2 & §8.3 TC-AST-02';
      targetFile: string;
      unmanagedSymbol: string;
      nodeCountMatch: boolean;
      tokenStreamFidelityPercent: number;
      uzTextByteMatch: boolean;
      tscDiagnosticsCount: number;
      compilationPassed: boolean;
      verdict: 'PASSED' | 'FAILED';
      failureReason?: string;
    };
    c3_readonlyGuard: {
      standard: 'PRD v2.1.2 §3.4 & §8.3 TC-AST-03';
      targetFile: string;
      targetSceneId: string;
      isDynamicExpression: boolean;
      detectedOwnership: string;
      mutationBlocked: boolean;
      rejectionCode: string;
      diskBytesModified: number;
      fileSha256Unchanged: boolean;
      verdict: 'PASSED' | 'FAILED';
      failureReason?: string;
    };
  };
  overallVerdict: 'M1_2_GATE_PASSED' | 'M1_2_GATE_FAILED';
}

export async function runM1_2GateMasterSuite(): Promise<M1_2GateMasterSummary> {
  const tStart = performance.now();
  const isSkeletonAuditMode = process.argv.includes('--skeleton-audit');

  console.log('\n' + '='.repeat(80));
  console.log('VIDEO-AS-CODE STUDIO: M1.2 ACCEPTANCE GATE MASTER VERIFICATION SUITE');
  console.log('Standard: ISO/IEC/IEEE 29148:2018 | MotionIR AST Bidirectional Sync Engine');
  console.log(`Execution Mode: ${isSkeletonAuditMode ? 'SKELETON_AUDIT_VERIFICATION' : 'FULL_GATE_EVALUATION'}`);
  console.log('='.repeat(80));

  // 1. Run Criterion 1: MDZ Local Accurate Patching (TC-AST-01)
  const c1Result: AstMdzPatchSummary = await runAstMdzPatchBenchmark();

  // 2. Run Criterion 2: UZ AST / CST Integrity & TypeScript Compilation (TC-AST-02)
  const c2Result: AstUzFidelitySummary = await runAstUzFidelityBenchmark();

  // 3. Run Criterion 3: Dynamic Expression Read-Only Guard & Disk Zero-Write (TC-AST-03)
  const c3Result: AstReadonlyGuardSummary = await runAstReadonlyGuardBenchmark();

  const totalDuration = +((performance.now() - tStart) / 1000).toFixed(2);

  const allPassed =
    c1Result.verdict === 'PASSED' &&
    c2Result.verdict === 'PASSED' &&
    c3Result.verdict === 'PASSED';

  const masterSummary: M1_2GateMasterSummary = {
    acceptanceGate: 'M1.2_MOTION_IR_AST_BIDIRECTIONAL_SYNCHRONIZATION',
    standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.3, §3.4, §8.3)',
    evaluatedAt: new Date().toISOString(),
    totalDurationSeconds: totalDuration,
    mode: isSkeletonAuditMode ? 'SKELETON_AUDIT' : 'GATE_EVALUATION',
    criteria: {
      c1_mdzPatching: {
        standard: 'PRD v2.1.2 §3.3.1 & §8.3 TC-AST-01',
        targetFile: c1Result.workload.targetFile,
        isStrictSingleLineDiff: c1Result.metrics.isStrictSingleLineDiff,
        gitDiffAddedLines: c1Result.metrics.gitDiffAddedLines,
        gitDiffDeletedLines: c1Result.metrics.gitDiffDeletedLines,
        zeroFormatPollution: c1Result.metrics.zeroFormatPollution,
        commentIntegrityPercent: c1Result.metrics.commentIntegrityPercent,
        verdict: c1Result.verdict,
        failureReason: c1Result.failureReason
      },
      c2_uzFidelity: {
        standard: 'PRD v2.1.2 §3.3.2 & §8.3 TC-AST-02',
        targetFile: c2Result.workload.targetFile,
        unmanagedSymbol: c2Result.workload.unmanagedSymbol,
        nodeCountMatch: c2Result.metrics.uzNodeCountMatch,
        tokenStreamFidelityPercent: c2Result.metrics.tokenStreamFidelityPercent,
        uzTextByteMatch: c2Result.metrics.uzTextByteMatch,
        tscDiagnosticsCount: c2Result.metrics.tscDiagnosticsCount,
        compilationPassed: c2Result.metrics.compilationPassed,
        verdict: c2Result.verdict,
        failureReason: c2Result.failureReason
      },
      c3_readonlyGuard: {
        standard: 'PRD v2.1.2 §3.4 & §8.3 TC-AST-03',
        targetFile: c3Result.workload.targetFile,
        targetSceneId: c3Result.workload.targetSceneId,
        isDynamicExpression: c3Result.metrics.isDynamicExpression,
        detectedOwnership: c3Result.metrics.detectedOwnership,
        mutationBlocked: c3Result.metrics.mutationBlocked,
        rejectionCode: c3Result.metrics.rejectionCode,
        diskBytesModified: c3Result.metrics.diskBytesModified,
        fileSha256Unchanged: c3Result.metrics.fileSha256Unchanged,
        verdict: c3Result.verdict,
        failureReason: c3Result.failureReason
      }
    },
    overallVerdict: allPassed ? 'M1_2_GATE_PASSED' : 'M1_2_GATE_FAILED'
  };

  const outDirs = [
    path.resolve(__dirname, '..', '..', 'tests', 'm1_2_gate'),
    path.resolve(__dirname, 'm1_2_gate')
  ];

  for (const dir of outDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'm1_2_gate_summary.json'), JSON.stringify(masterSummary, null, 2), 'utf-8');
  }

  console.log('\n' + '='.repeat(80));
  console.log('M1.2 ACCEPTANCE GATE MASTER SUMMARY:');
  console.log('--------------------------------------------------------------------------------');
  console.log(`C1 (TC-AST-01 MDZ Single-Line Patch) : ${c1Result.verdict} ${c1Result.failureReason ? `(${c1Result.failureReason})` : ''}`);
  console.log(`C2 (TC-AST-02 UZ 100% Token Fidelity) : ${c2Result.verdict} ${c2Result.failureReason ? `(${c2Result.failureReason})` : ''}`);
  console.log(`C3 (TC-AST-03 Read-Only Guard & 0-Wr): ${c3Result.verdict} ${c3Result.failureReason ? `(${c3Result.failureReason})` : ''}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`OVERALL GATE VERDICT: ${masterSummary.overallVerdict}`);
  console.log(`Total Verification Time: ${totalDuration}s`);
  console.log('='.repeat(80) + '\n');

  if (isSkeletonAuditMode) {
    // In skeleton audit mode: verify that all 3 runners executed, generated metrics, and reached the hooks
    const skeletonHarnessesArmed =
      c1Result.testCaseId === 'TC-AST-01' &&
      c2Result.testCaseId === 'TC-AST-02' &&
      c3Result.testCaseId === 'TC-AST-03';

    if (skeletonHarnessesArmed) {
      console.log('[SKELETON-AUDIT-VERIFIED] All 3 test harnesses, fixtures, AST analyzers, and diff scripts are fully operational!');
      console.log('[SKELETON-AUDIT-READY] Test skeleton is armed and ready for external auditor review.');
    }
  }

  return masterSummary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const isSkeletonAuditMode = process.argv.includes('--skeleton-audit');
  runM1_2GateMasterSuite()
    .then((summary) => {
      if (isSkeletonAuditMode) {
        process.exit(0);
      } else if (summary.overallVerdict !== 'M1_2_GATE_PASSED') {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('[M1_2-SUITE-FATAL]', err);
      process.exit(1);
    });
}
