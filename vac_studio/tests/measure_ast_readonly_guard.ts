/**
 * Video-as-Code Studio - Dynamic Expression Read-Only Guard & AST Zero-Write Benchmark
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.4, §8.3 TC-AST-03 & WBS-1.7/1.8
 *
 * SPECIFICATION (TC-AST-03 验收条款):
 * 1. 动态与不可解析表达式静态求值分析: 节点为 durationInFrames={calcDynamicDuration(props)};
 * 2. 所有权降级锁定: AST 引擎将节点所有权状态标记为 OPAQUE_USER_CODE，时间轴标注只读徽标;
 * 3. GUI 回写严格拦截: 尝试修改该动态节点时，系统拦截变更并返回 OPAQUE_USER_CODE_LOCKED;
 * 4. 磁盘零覆写保真: 磁盘源文件 bytesModified 严格为 0，SHA256 分毫不差，源码逻辑获得安全保护.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { Project, SyntaxKind } from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AstReadonlyGuardSummary {
  testCaseId: 'TC-AST-03';
  standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.4 & §8.3)';
  evaluatedAt: string;
  workload: {
    targetFile: string;
    targetSceneId: string;
    dynamicExpression: string;
    attemptedMutationValue: number;
  };
  metrics: {
    nodeSyntaxKind: string;
    isDynamicExpression: boolean;
    detectedOwnership: 'MANAGED_DECLARATIVE' | 'OPAQUE_USER_CODE' | 'UNKNOWN';
    readOnlyBadgeTagged: boolean;
    mutationBlocked: boolean;
    rejectionCode: string;
    userWarningEmitted: boolean;
    warningMessageText: string;
    diskBytesModified: number;
    fileSha256Unchanged: boolean;
  };
  verdict: 'PASSED' | 'FAILED';
  failureReason?: string;
}

export async function runAstReadonlyGuardBenchmark(): Promise<AstReadonlyGuardSummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M1.2 GATE: DYNAMIC EXPRESSION READ-ONLY GUARD & ZERO-WRITE (TC-AST-03)');
  console.log('Criteria: Ownership = OPAQUE_USER_CODE | Mutation Blocked | Disk bytes modified = 0');
  console.log('='.repeat(80));

  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const templatePath = path.join(fixturesDir, 'ast_sample_act1.tsx');
  const stagingPath = path.join(fixturesDir, 'ast_sample_act1.guard_staged.tsx');

  // Copy template fixture to staging area
  fs.copyFileSync(templatePath, stagingPath);
  const initialContent = fs.readFileSync(stagingPath, 'utf-8');
  const initialSha256 = crypto.createHash('sha256').update(initialContent).digest('hex');
  const initialStat = fs.statSync(stagingPath);

  // 1. Static AST Node Analysis using ts-morph
  const project = new Project({
    compilerOptions: {
      jsx: 1,
      strict: false,
      noEmit: true
    }
  });
  const source = project.addSourceFileAtPath(stagingPath);

  // Find Sequence element with name="Scene02_Dynamic"
  const sequences = source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .concat(source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement) as any);

  let targetSeq: any = null;
  for (const seq of sequences) {
    const nameAttr = seq.getAttribute('name');
    if (nameAttr && nameAttr.getText().includes('Scene02_Dynamic')) {
      targetSeq = seq;
      break;
    }
  }

  let nodeSyntaxKind = 'UNKNOWN';
  let isDynamic = false;
  if (targetSeq) {
    const durationAttr = targetSeq.getAttribute('durationInFrames');
    if (durationAttr) {
      const initializer = durationAttr.getInitializer();
      if (initializer) {
        nodeSyntaxKind = initializer.getKindName();
        // Check if inside JsxExpression is a CallExpression or non-literal
        const expr = initializer.asKind(SyntaxKind.JsxExpression)?.getExpression();
        if (expr) {
          nodeSyntaxKind = `${initializer.getKindName()} -> ${expr.getKindName()}`;
          isDynamic = expr.getKind() !== SyntaxKind.NumericLiteral;
        }
      }
    }
  }

  // 2. Invoke AST Guard / Emitter (To be plugged in WBS-1.8 implementation)
  let engineLoaded = false;
  let detectedOwnership: 'MANAGED_DECLARATIVE' | 'OPAQUE_USER_CODE' | 'UNKNOWN' = 'UNKNOWN';
  let readOnlyBadgeTagged = false;
  let mutationBlocked = false;
  let rejectionCode = 'NONE';
  let warningMessage = '';

  try {
    const astGuard = await import('../server/ast_engine/guard.js').catch(() => null);
    if (astGuard && typeof astGuard.attemptSceneMutation === 'function') {
      engineLoaded = true;
      const res = await astGuard.attemptSceneMutation(stagingPath, 'Scene02_Dynamic', 450);
      detectedOwnership = res.ownership;
      readOnlyBadgeTagged = res.isReadOnly;
      mutationBlocked = res.blocked;
      rejectionCode = res.code;
      warningMessage = res.warningMessage || '';
    } else {
      console.log('[SKELETON-AUDIT] AST Guard engine hook registered. Pending engine implementation.');
    }
  } catch (err: any) {
    console.warn('[AST-GUARD-WARN]', err.message);
  }

  // 3. Measure Disk Zero-Write Invariant
  const finalContent = fs.readFileSync(stagingPath, 'utf-8');
  const finalSha256 = crypto.createHash('sha256').update(finalContent).digest('hex');
  const finalStat = fs.statSync(stagingPath);

  const fileSha256Unchanged = initialSha256 === finalSha256;
  const diskBytesModified = Math.abs(finalStat.size - initialStat.size);
  const userWarningEmitted =
    warningMessage.includes('动态表达式') ||
    warningMessage.includes('锁定') ||
    rejectionCode === 'OPAQUE_USER_CODE_LOCKED';

  let passed =
    engineLoaded &&
    isDynamic &&
    detectedOwnership === 'OPAQUE_USER_CODE' &&
    readOnlyBadgeTagged &&
    mutationBlocked &&
    rejectionCode === 'OPAQUE_USER_CODE_LOCKED' &&
    diskBytesModified === 0 &&
    fileSha256Unchanged;

  let failureReason: string | undefined;
  if (!engineLoaded) {
    passed = false;
    failureReason = 'SKELETON_AUDIT_MODE: AST Guard not yet implemented (Pending WBS-1.8)';
  } else if (!isDynamic) {
    passed = false;
    failureReason = 'Dynamic expression evaluation failed: target node was not recognized as dynamic';
  } else if (detectedOwnership !== 'OPAQUE_USER_CODE') {
    passed = false;
    failureReason = `Ownership classification error: expected OPAQUE_USER_CODE, got ${detectedOwnership}`;
  } else if (!mutationBlocked) {
    passed = false;
    failureReason = 'Security violation: dynamic node mutation was NOT blocked!';
  } else if (diskBytesModified !== 0 || !fileSha256Unchanged) {
    passed = false;
    failureReason = `Disk write violation: file was modified (${diskBytesModified} bytes changed)`;
  }

  const summary: AstReadonlyGuardSummary = {
    testCaseId: 'TC-AST-03',
    standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.4 & §8.3)',
    evaluatedAt: new Date().toISOString(),
    workload: {
      targetFile: 'fixtures/ast_sample_act1.tsx',
      targetSceneId: 'Scene02_Dynamic',
      dynamicExpression: 'calcDynamicDuration(props)',
      attemptedMutationValue: 450
    },
    metrics: {
      nodeSyntaxKind,
      isDynamicExpression: isDynamic,
      detectedOwnership,
      readOnlyBadgeTagged,
      mutationBlocked,
      rejectionCode,
      userWarningEmitted,
      warningMessageText: warningMessage,
      diskBytesModified,
      fileSha256Unchanged
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
    fs.writeFileSync(path.join(dir, 'ast_readonly_guard_summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  }

  console.log(`\n[TC-AST-03 METRICS]`);
  console.log(`  -> Syntax Kind           : ${nodeSyntaxKind}`);
  console.log(`  -> Is Dynamic Expression : ${isDynamic ? 'YES' : 'NO'}`);
  console.log(`  -> Detected Ownership    : ${detectedOwnership} (Expected: OPAQUE_USER_CODE)`);
  console.log(`  -> Read-Only Badge Tag   : ${readOnlyBadgeTagged ? 'TAGGED' : 'MISSING'}`);
  console.log(`  -> Mutation Blocked      : ${mutationBlocked ? 'BLOCKED' : 'NOT BLOCKED'}`);
  console.log(`  -> Rejection Code        : ${rejectionCode} (Expected: OPAQUE_USER_CODE_LOCKED)`);
  console.log(`  -> Disk Bytes Modified   : ${diskBytesModified} (Budget: strictly 0)`);
  console.log(`  -> SHA-256 Unchanged     : ${fileSha256Unchanged ? 'MATCH' : 'TAMPERED'}`);
  console.log(`\nTC-AST-03 VERDICT: ${summary.verdict} ${failureReason ? `(${failureReason})` : ''}`);

  return summary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runAstReadonlyGuardBenchmark()
    .then((s) => {
      if (s.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[TC-AST-03-FATAL]', err);
      process.exit(1);
    });
}
