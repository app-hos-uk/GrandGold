/**
 * MediaPipe Face Landmarker - Face tracking for AR try-on
 */

import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

let faceLandmarkerInstance: FaceLandmarker | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (typeof window === 'undefined') return null;
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  const vision = await import('@mediapipe/tasks-vision');
  const { FaceLandmarker, FilesetResolver } = vision;

  const wasmFileset = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  faceLandmarkerInstance = await FaceLandmarker.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    numFaces: 1,
    runningMode: 'VIDEO',
  });
  return faceLandmarkerInstance;
}

export type { FaceLandmarkerResult };

/** Ear lobe landmark indices (approximate for MediaPipe) */
export const EAR_LEFT = 234; // Left ear region
export const EAR_RIGHT = 454; // Right ear region
/** Nose bridge / necklace reference */
export const NOSE_TIP = 4;
export const CHIN = 152;
export const FOREHEAD = 10;

export interface FaceLandmarks {
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  nose: { x: number; y: number };
  chin: { x: number; y: number };
}

/** Convert normalized (0-1) landmarks to pixel coordinates */
export function getEarPositions(
  landmarks: { x: number; y: number }[],
  width = 1,
  height = 1
): FaceLandmarks | null {
  if (!landmarks || landmarks.length < 455) return null;
  const scale = (p: { x: number; y: number }) => ({ x: p.x * width, y: p.y * height });
  return {
    leftEar: scale(landmarks[EAR_LEFT] ?? landmarks[234]),
    rightEar: scale(landmarks[EAR_RIGHT] ?? landmarks[454]),
    nose: scale(landmarks[NOSE_TIP] ?? landmarks[4]),
    chin: scale(landmarks[CHIN] ?? landmarks[152]),
  };
}
