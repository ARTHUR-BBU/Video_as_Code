/**
 * Video-as-Code Studio - MotionIR AST Emitter & CST Pinpoint Mutator
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.3.1, §3.3.2 & §8.3 TC-AST-01
 *
 * Guarantees:
 * 1. CST-level pinpoint node replacement (strictly modifies only the target NumericLiteral).
 * 2. Zero format pollution: preserves all comments, indentations, blank lines, and non-target nodes.
 * 3. Never triggers full-file reformatting or Prettier rewrites.
 */

import fs from 'node:fs';
import { Project, SyntaxKind } from 'ts-morph';

export interface PatchResult {
  success: boolean;
  modified: boolean;
  bytesModified: number;
  sceneId: string;
  newDuration: number;
}

export async function patchSequenceDuration(
  filePath: string,
  sceneId: string,
  newDuration: number
): Promise<PatchResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[AST-EMITTER] File not found: ${filePath}`);
  }

  const initialStat = fs.statSync(filePath);

  const project = new Project({
    compilerOptions: {
      jsx: 1, // Preserve JSX
      strict: false,
      noEmit: true
    }
  });

  const sourceFile = project.addSourceFileAtPath(filePath);

  const sequences = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
  ];

  let targetFound = false;

  for (const seq of sequences) {
    const tagName = seq.getTagNameNode().getText();
    if (tagName !== 'Sequence') continue;

    const nameAttr = seq.getAttribute('name');
    if (!nameAttr || !('getInitializer' in nameAttr)) continue;
    const nameVal = nameAttr.getInitializer()?.getText().replace(/['"]/g, '');

    if (nameVal === sceneId) {
      const durAttr = seq.getAttribute('durationInFrames');
      if (durAttr && 'getInitializer' in durAttr) {
        const init = durAttr.getInitializer();
        if (init) {
          if (init.getKind() === SyntaxKind.NumericLiteral) {
            init.replaceWithText(String(newDuration));
            targetFound = true;
          } else if (init.getKind() === SyntaxKind.JsxExpression) {
            const expr = init.asKind(SyntaxKind.JsxExpression)?.getExpression();
            if (expr && expr.getKind() === SyntaxKind.NumericLiteral) {
              expr.replaceWithText(String(newDuration));
              targetFound = true;
            }
          }
        }
      }
      break;
    }
  }

  if (!targetFound) {
    return {
      success: false,
      modified: false,
      bytesModified: 0,
      sceneId,
      newDuration
    };
  }

  // Save changes to disk with zero format pollution
  sourceFile.saveSync();

  const finalStat = fs.statSync(filePath);
  const bytesModified = Math.abs(finalStat.size - initialStat.size);

  return {
    success: true,
    modified: true,
    bytesModified,
    sceneId,
    newDuration
  };
}
