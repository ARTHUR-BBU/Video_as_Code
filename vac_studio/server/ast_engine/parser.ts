/**
 * Video-as-Code Studio - MotionIR AST Parser & Static Type Evaluator
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.3 & §3.4
 */

import { Project, SyntaxKind } from 'ts-morph';
import { SceneTrackNode, CodeOwnership } from './motion_ir.js';

export interface ParseResult {
  scenes: SceneTrackNode[];
  rawNodeCount: number;
}

export function parseAstToMotionIR(filePath: string, _projectId = 'vac_core'): ParseResult {
  const project = new Project({
    compilerOptions: {
      jsx: 1, // Preserve
      strict: false,
      noEmit: true
    }
  });

  const sourceFile = project.addSourceFileAtPath(filePath);
  const scenes: SceneTrackNode[] = [];

  // Traverse JSX elements: both self-closing and opening elements
  const allElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
  ];

  for (const el of allElements) {
    const tagName = el.getTagNameNode().getText();
    if (tagName !== 'Sequence') continue;

    const nameAttr = el.getAttribute('name');
    const fromAttr = el.getAttribute('from');
    const durationAttr = el.getAttribute('durationInFrames');

    // Extract scene identifier
    let sceneId = 'Unnamed_Sequence';
    if (nameAttr && 'getInitializer' in nameAttr) {
      const init = nameAttr.getInitializer();
      if (init) {
        sceneId = init.getText().replace(/['"]/g, '');
      }
    }

    // Extract start frame
    let startFrame = 0;
    if (fromAttr && 'getInitializer' in fromAttr) {
      const init = fromAttr.getInitializer();
      if (init) {
        const text = init.getText().replace(/[{}]/g, '').trim();
        startFrame = parseInt(text, 10) || 0;
      }
    }

    // Static Type Evaluator on durationInFrames
    let durationFrames = 0;
    let ownership: CodeOwnership = 'OPAQUE_USER_CODE';
    let isReadOnly = true;
    let lockReason: 'DYNAMIC_EXPRESSION' | undefined = undefined;

    if (durationAttr && 'getInitializer' in durationAttr) {
      const init = durationAttr.getInitializer();
      if (init) {
        const kind = init.getKind();

        if (kind === SyntaxKind.NumericLiteral) {
          durationFrames = parseInt(init.getText(), 10);
          ownership = 'MANAGED_DECLARATIVE';
          isReadOnly = false;
        } else if (kind === SyntaxKind.JsxExpression) {
          const expr = init.asKind(SyntaxKind.JsxExpression)?.getExpression();
          if (expr && expr.getKind() === SyntaxKind.NumericLiteral) {
            durationFrames = parseInt(expr.getText(), 10);
            ownership = 'MANAGED_DECLARATIVE';
            isReadOnly = false;
          } else {
            // Expression is CallExpression, Identifier, BinaryExpression, etc.
            ownership = 'OPAQUE_USER_CODE';
            isReadOnly = true;
            lockReason = 'DYNAMIC_EXPRESSION';
            durationFrames = -1; // Flag dynamic evaluation
          }
        }
      }
    }

    scenes.push({
      id: sceneId,
      sourceFile: filePath,
      startFrame,
      durationFrames,
      ownership,
      isReadOnly,
      lockReason
    });
  }

  return {
    scenes,
    rawNodeCount: sourceFile.getDescendants().length
  };
}
