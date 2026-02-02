'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getFaceLandmarker, getEarPositions } from '@/lib/mediapipe-face';

export interface ARAdjustment {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface ARFaceTryOnProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  productCategory: 'earrings' | 'necklace';
  isActive: boolean;
  adjustment?: ARAdjustment;
  /** For comparison mode: show both earrings and necklace */
  showNecklace?: boolean;
  showEarrings?: boolean;
}

/** Draw earring/necklace overlay at face landmark positions */
function drawJewelryOverlay(
  ctx: CanvasRenderingContext2D,
  positions: ReturnType<typeof getEarPositions> | null,
  options: {
    drawEarrings: boolean;
    drawNecklace: boolean;
    adj: { offsetX: number; offsetY: number; scale: number };
  }
) {
  if (!positions) return;
  const { drawEarrings, drawNecklace, adj } = options;
  const tx = (x: number, y: number) => ({
    x: (x - ctx.canvas.width / 2) * adj.scale + ctx.canvas.width / 2 + adj.offsetX,
    y: (y - ctx.canvas.height / 2) * adj.scale + ctx.canvas.height / 2 + adj.offsetY,
  });

  ctx.save();

  if (drawEarrings) {
    const size = 24 * adj.scale;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    [positions.leftEar, positions.rightEar].forEach((p) => {
      const { x, y } = tx(p.x, p.y);
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  if (drawNecklace) {
    const { leftEar, rightEar, chin } = positions;
    const l = tx(leftEar.x, leftEar.y);
    const r = tx(rightEar.x, rightEar.y);
    const c = tx((leftEar.x + rightEar.x) / 2, chin.y + 20);
    const midY = (l.y + c.y) / 2 + 20;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.lineWidth = 8 * adj.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.quadraticCurveTo(l.x - 30, midY, c.x, c.y);
    ctx.quadraticCurveTo(r.x + 30, midY, r.x, r.y);
    ctx.stroke();
  }

  ctx.restore();
}

export function ARFaceTryOn({
  videoRef,
  canvasRef,
  productCategory,
  isActive,
  adjustment = { offsetX: 0, offsetY: 0, scale: 1 },
  showNecklace,
  showEarrings,
}: ARFaceTryOnProps) {
  const rafRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  const drawEarrings = showEarrings ?? (productCategory === 'earrings');
  const drawNecklace = showNecklace ?? (productCategory === 'necklace');

  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive || video.readyState < 2) return;

    const faceLandmarker = await getFaceLandmarker();
    if (!faceLandmarker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timestamp = video.currentTime;
    if (timestamp === lastVideoTimeRef.current) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    lastVideoTimeRef.current = timestamp;

    const result = faceLandmarker.detectForVideo(video, performance.now());
    const landmarks = result.faceLandmarks?.[0];
    const positions = getEarPositions(landmarks ?? [], canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawJewelryOverlay(ctx, positions, {
      drawEarrings,
      drawNecklace,
      adj: adjustment,
    });

    rafRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, canvasRef, drawEarrings, drawNecklace, adjustment, isActive]);

  useEffect(() => {
    if (isActive) {
      processFrame();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, processFrame]);

  return null;
}
