'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getHandLandmarker, RING_FINGER_TIP } from '@/lib/mediapipe-hand';

interface ARRingTryOnProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  adjustment?: { offsetX: number; offsetY: number; scale: number };
}

function drawRingOverlay(
  ctx: CanvasRenderingContext2D,
  positions: { x: number; y: number }[],
  scale = 1,
  offsetX = 0,
  offsetY = 0
) {
  if (positions.length === 0) return;
  ctx.save();

  positions.forEach((p) => {
    const x = p.x + offsetX;
    const y = p.y + offsetY;
    const size = 16 * scale;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

export function ARRingTryOn({
  videoRef,
  canvasRef,
  isActive,
  adjustment = { offsetX: 0, offsetY: 0, scale: 1 },
}: ARRingTryOnProps) {
  const { offsetX, offsetY, scale } = adjustment;
  const rafRef = useRef<number>();

  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive || video.readyState < 2) return;

    const handLandmarker = await getHandLandmarker();
    if (!handLandmarker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const result = handLandmarker.detectForVideo(video, performance.now());
    const hands = result.landmarks ?? [];
    const positions: { x: number; y: number }[] = [];

    for (const landmarks of hands) {
      if (landmarks[RING_FINGER_TIP]) {
        positions.push({
          x: landmarks[RING_FINGER_TIP].x * canvas.width,
          y: landmarks[RING_FINGER_TIP].y * canvas.height,
        });
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawRingOverlay(ctx, positions, scale, offsetX, offsetY);

    rafRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, canvasRef, isActive, scale, offsetX, offsetY]);

  useEffect(() => {
    if (isActive) processFrame();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, processFrame]);

  return null;
}
