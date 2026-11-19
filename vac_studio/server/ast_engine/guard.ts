/**
 * Video-as-Code Studio - Dynamic Expression Read-Only Guard & AST Safety Interceptor
 * Standard: ISO/IEC/IEEE 29148:2018 | PRD v2.1.2 §3.4 & §8.3 TC-AST-03
 *
 * Responsibilities:
 * 1. Evaluates code ownership (MANAGED_DECLARATIVE vs OPAQUE_USER_CODE).
 * 2. Enforces read-only downgrade for dynamic expressions (CallExpression, variables, hooks).
 * 3. Strictly blocks GUI writebacks for opaque nodes, protecting source code logic.
 * 4. Ensures zero disk writes (bytesModified === 0) on intercepted requests.
 */

import { parseAstToMotionIR } from './parser.js';
import { patchSequenceDuration } from './emitter.js';
import { CodeOwnership } from './motion_ir.js';

export interface MutationGuardResult {
  success: boolean;
  blocked: boolean;
  code: 'MUTATION_COMMITTED' | 'OPAQUE_USER_CODE_LOCKED' | 'SCENE_NOT_FOUND' | 'GUARD_ERROR';
  ownership: CodeOwnership | 'UNKNOWN';
  isReadOnly: boolean;
  warningMessage?: string;
  bytesModified: number;
  sceneId: string;
  duration?: number;
}

export async function attemptSceneMutation(
  filePath: string,
  sceneId: string,
  requestedDuration: number
): Promise<MutationGuardResult> {
  try {
    const parseResult = parseAstToMotionIR(filePath);
    const targetScene = parseResult.scenes.find((s) => s.id === sceneId);

    if (!targetScene) {
      return {
        success: false,
        blocked: true,
        code: 'SCENE_NOT_FOUND',
        ownership: 'UNKNOWN',
        isReadOnly: false,
        warningMessage: `Scene '${sceneId}' not found in target AST`,
        bytesModified: 0,
        sceneId
      };
    }

    // Safety Intercept Gate: Check ownership and read-only status
    if (targetScene.ownership === 'OPAQUE_USER_CODE' || targetScene.isReadOnly) {
      return {
        success: false,
        blocked: true,
        code: 'OPAQUE_USER_CODE_LOCKED',
        ownership: 'OPAQUE_USER_CODE',
        isReadOnly: true,
        warningMessage: '检测到动态表达式控制，已锁定 GUI 回写以保护源码逻辑',
        bytesModified: 0,
        sceneId,
        duration: targetScene.durationFrames
      };
    }

    // Permitted: Node is in Managed Declarative Zone (MDZ)
    const patchResult = await patchSequenceDuration(filePath, sceneId, requestedDuration);

    return {
      success: patchResult.success,
      blocked: false,
      code: 'MUTATION_COMMITTED',
      ownership: 'MANAGED_DECLARATIVE',
      isReadOnly: false,
      bytesModified: patchResult.bytesModified,
      sceneId,
      duration: requestedDuration
    };
  } catch (err: any) {
    return {
      success: false,
      blocked: true,
      code: 'GUARD_ERROR',
      ownership: 'UNKNOWN',
      isReadOnly: true,
      warningMessage: `AST Guard error: ${err.message}`,
      bytesModified: 0,
      sceneId
    };
  }
}
