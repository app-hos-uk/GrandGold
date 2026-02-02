/**
 * MediaPipe Hand Landmarker - Finger/ring tracking for AR try-on
 */

import type { HandLandmarker } from '@mediapipe/tasks-vision';

let handLandmarkerInstance: HandLandmarker | null = null;

export async function getHandLandmarker(): Promise<HandLandmarker | null> {
  if (typeof window === 'undefined') return null;
  if (handLandmarkerInstance) return handLandmarkerInstance;

  const vision = await import('@mediapipe/tasks-vision');
  const { HandLandmarker, FilesetResolver } = vision;

  const wasmFileset = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  handLandmarkerInstance = await HandLandmarker.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    numHands: 2,
    runningMode: 'VIDEO',
  });
  return handLandmarkerInstance;
}

/** Ring finger tip landmark (index 4 for each finger) - we use middle finger tip for ring */
export const RING_FINGER_TIP = 12; // Middle finger tip
export const RING_FINGER_PIP = 10;  // Middle finger PIP (for rotation/orientation)
