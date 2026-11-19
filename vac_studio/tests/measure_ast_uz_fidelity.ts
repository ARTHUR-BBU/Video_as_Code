/**
 * Video-as-Code Studio - Unmanaged User-Code Zone (UZ) Integrity & CST Fidelity Benchmark
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.3.2, §8.3 TC-AST-02 & WBS-1.7/1.8
 *
 * SPECIFICATION (TC-AST-02 验收条款):
 * 1. 非托管自由逻辑区 (UZ) 完整性保真: 包含复杂的物理着色器自定义数学逻辑 (Lambda 闭包、位运算操作符 <<, ^, >>);
 * 2. CST 语法保真: AST 改写器实施 MDZ 变更时，UZ 区域代码的 AST 节点树结构保持 100% 同构;
 * 3. 语法标记与注释 100% 字节级保真: 注释 // NOTE: Critical complex hook、缩进、空行分毫不差;
 * 4. TypeScript 零编译报错: 改写后文件执行 TypeScript 编译器静态诊断，diagnosticsCount 严格为 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind, Node } from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AstUzFidelitySummary {
  testCaseId: 'TC-AST-02';
  standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.3.2 & §8.3)';
  evaluatedAt: string;
  workload: {
    targetFile: string;
    unmanagedSymbol: string;
    bitwiseOperatorsTested: string[];
  };
  metrics: {
    originalUzNodeCount: number;
    stagedUzNodeCount: number;
    uzNodeCountMatch: boolean;
    tokenStreamFidelityPercent: number;
    uzTextByteMatch: boolean;
    commentTriviaPreserved: boolean;
    tscDiagnosticsCount: number;
    compilationPassed: boolean;
  };
  verdict: 'PASSED' | 'FAILED';
  failureReason?: string;
}

export async function runAstUzFidelityBenchmark(): Promise<AstUzFidelitySummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M1.2 GATE: UNMANAGED USER-CODE ZONE (UZ) INTEGRITY & CODE FIDELITY (TC-AST-02)');
  console.log('Criteria: 100% AST Token Fidelity | Bitwise & Lambda preservation | tsc 0 diagnostics');
  console.log('='.repeat(80));

  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const templatePath = path.join(fixturesDir, 'ast_sample_act1.tsx');
  const stagingPath = path.join(fixturesDir, 'ast_sample_act1.uz_staged.tsx');

  // Copy template fixture to staging area
  fs.copyFileSync(templatePath, stagingPath);

  // 1. Parse Original AST Structure using ts-morph
  const project = new Project({
    compilerOptions: {
      jsx: 1, // Preserve
      strict: false,
      noEmit: true
    }
  });

  const origSource = project.addSourceFileAtPath(templatePath);
  const origUzDecl = origSource.getVariableDeclaration('useComplexPhysics');

  if (!origUzDecl) {
    throw new Error('TC-AST-02 FATAL: Target UZ symbol useComplexPhysics not found in template fixture');
  }

  const origUzStatement = origUzDecl.getVariableStatementOrThrow();
  const origUzText = origUzStatement.getText();
  const origDescendants = origUzStatement.getDescendants();
  const origNodeCount = origDescendants.length;
  const origTokenKinds = origDescendants.map((d) => d.getKind());

  // 2. Invoke AST Engine Emitter (To be plugged in WBS-1.8 implementation)
  let engineLoaded = false;
  try {
    const astEngine = await import('../server/ast_engine/emitter.js').catch(() => null);
    if (astEngine && typeof astEngine.patchSequenceDuration === 'function') {
      await astEngine.patchSequenceDuration(stagingPath, 'Scene01', 285);
      engineLoaded = true;
    } else {
      console.log('[SKELETON-AUDIT] AST Engine emitter hook registered. Pending engine implementation.');
    }
  } catch (err: any) {
    console.warn('[AST-UZ-WARN]', err.message);
  }

  // 3. Parse Staged AST Structure
  const stagedProject = new Project({
    compilerOptions: {
      jsx: 1,
      strict: false,
      noEmit: true
    }
  });
  const stagedSource = stagedProject.addSourceFileAtPath(stagingPath);
  const stagedUzDecl = stagedSource.getVariableDeclaration('useComplexPhysics');

  let stagedNodeCount = 0;
  let uzNodeCountMatch = false;
  let tokenFidelityPercent = 0;
  let uzTextByteMatch = false;
  let commentTriviaPreserved = false;
  let tscDiagnosticsCount = 0;

  if (stagedUzDecl) {
    const stagedUzStatement = stagedUzDecl.getVariableStatementOrThrow();
    const stagedUzText = stagedUzStatement.getText();
    const stagedDescendants = stagedUzStatement.getDescendants();
    stagedNodeCount = stagedDescendants.length;
    const stagedTokenKinds = stagedDescendants.map((d) => d.getKind());

    uzNodeCountMatch = origNodeCount === stagedNodeCount;

    // Token stream comparison
    let matchingTokens = 0;
    const maxTokens = Math.max(origTokenKinds.length, stagedTokenKinds.length);
    for (let i = 0; i < maxTokens; i++) {
      if (origTokenKinds[i] === stagedTokenKinds[i]) {
        matchingTokens++;
      }
    }
    tokenFidelityPercent = maxTokens > 0 ? (matchingTokens / maxTokens) * 100 : 0;

    uzTextByteMatch = origUzText === stagedUzText;

    // Check comment trivia on the node
    const fullStagedText = stagedSource.getFullText();
    commentTriviaPreserved =
      fullStagedText.includes('// NOTE: Critical complex hook - DO NOT TOUCH OR REFORMAT') &&
      fullStagedText.includes('// Custom bitwise shader math & lambda closure');

    // Run TypeScript compilation diagnostics on staged file
    const diagnostics = stagedSource.getPreEmitDiagnostics();
    tscDiagnosticsCount = diagnostics.length;
  }

  const compilationPassed = tscDiagnosticsCount === 0;

  let passed =
    engineLoaded &&
    uzNodeCountMatch &&
    tokenFidelityPercent === 100 &&
    uzTextByteMatch &&
    commentTriviaPreserved &&
    compilationPassed;

  let failureReason: string | undefined;
  if (!engineLoaded) {
    passed = false;
    failureReason = 'SKELETON_AUDIT_MODE: AST Engine Emitter not yet implemented (Pending WBS-1.8)';
  } else if (!uzNodeCountMatch) {
    passed = false;
    failureReason = `UZ AST Node count mismatch: orig=${origNodeCount}, staged=${stagedNodeCount}`;
  } else if (tokenFidelityPercent !== 100) {
    passed = false;
    failureReason = `Token fidelity violation: ${tokenFidelityPercent}% (Expected 100%)`;
  } else if (!uzTextByteMatch) {
    passed = false;
    failureReason = 'UZ text byte mismatch: unexpected code mutation inside unmanaged zone';
  } else if (!commentTriviaPreserved) {
    passed = false;
    failureReason = 'CST trivia dropped: critical comments missing after mutation';
  } else if (!compilationPassed) {
    passed = false;
    failureReason = `TypeScript compilation failed with ${tscDiagnosticsCount} diagnostics`;
  }

  const summary: AstUzFidelitySummary = {
    testCaseId: 'TC-AST-02',
    standard: 'ISO/IEC/IEEE 29148:2018 (PRD v2.1.2 §3.3.2 & §8.3)',
    evaluatedAt: new Date().toISOString(),
    workload: {
      targetFile: 'fixtures/ast_sample_act1.tsx',
      unmanagedSymbol: 'useComplexPhysics',
      bitwiseOperatorsTested: ['<<', '^', '>>']
    },
    metrics: {
      originalUzNodeCount: origNodeCount,
      stagedUzNodeCount: stagedNodeCount,
      uzNodeCountMatch,
      tokenStreamFidelityPercent: tokenFidelityPercent,
      uzTextByteMatch,
      commentTriviaPreserved,
      tscDiagnosticsCount,
      compilationPassed
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
    fs.writeFileSync(path.join(dir, 'ast_uz_fidelity_summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  }

  console.log(`\n[TC-AST-02 METRICS]`);
  console.log(`  -> Original UZ Node Count : ${origNodeCount}`);
  console.log(`  -> Staged UZ Node Count   : ${stagedNodeCount}`);
  console.log(`  -> Node Count Match       : ${uzNodeCountMatch ? 'YES' : 'NO'}`);
  console.log(`  -> Token Stream Fidelity  : ${tokenFidelityPercent.toFixed(1)}% (Budget: 100.0%)`);
  console.log(`  -> UZ Text Byte Match     : ${uzTextByteMatch ? 'YES' : 'NO'}`);
  console.log(`  -> Comment Trivia Guard   : ${commentTriviaPreserved ? 'PRESERVED' : 'DROPPED'}`);
  console.log(`  -> TypeScript Diagnostics : ${tscDiagnosticsCount} (Budget: 0)`);
  console.log(`  -> Compilation Passed     : ${compilationPassed ? 'YES' : 'NO'}`);
  console.log(`\nTC-AST-02 VERDICT: ${summary.verdict} ${failureReason ? `(${failureReason})` : ''}`);

  return summary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runAstUzFidelityBenchmark()
    .then((s) => {
      if (s.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[TC-AST-02-FATAL]', err);
      process.exit(1);
    });
}
