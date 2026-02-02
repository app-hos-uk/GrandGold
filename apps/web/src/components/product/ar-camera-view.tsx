'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ARFaceTryOn, type ARAdjustment } from './ar-face-tryon';
import { ARRingTryOn } from './ar-ring-tryon';

export type ProductCategory = 'earrings' | 'necklace' | 'ring';

interface ARCameraViewProps {
  productCategory: ProductCategory;
  comparisonMode?: boolean;
  adjustment?: ARAdjustment;
  onPermissionDenied?: () => void;
  onStop?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function ARCameraView({
  productCategory,
  comparisonMode = false,
  adjustment = { offsetX: 0, offsetY: 0, scale: 1 },
  onPermissionDenied,
  onStop,
  canvasRef: externalCanvasRef,
}: ARCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error('Video or canvas element not found');
      }

      video.srcObject = stream;
      await video.play();

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      canvas.width = vw;
      canvas.height = vh;

      setStatus('active');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access failed';
      setErrorMessage(msg);
      setStatus('error');
      if (msg.includes('Permission') || msg.includes('denied')) {
        onPermissionDenied?.();
      }
    }
  }, [onPermissionDenied]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus('idle');
    setErrorMessage(null);
    onStop?.();
  }, [onStop]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (status === 'idle' || status === 'error' || status === 'requesting') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
        {status === 'error' && (
          <p className="text-red-400 text-sm mb-4 text-center px-4">{errorMessage}</p>
        )}
        <button
          onClick={startCamera}
          disabled={status === 'requesting'}
          className="px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {status === 'requesting' ? 'Starting...' : 'Enable Camera'}
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (externalCanvasRef && canvasRef.current) {
      (externalCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
        canvasRef.current;
    }
  }, [externalCanvasRef, status]);

  const isFace = productCategory === 'earrings' || productCategory === 'necklace';
  const isRing = productCategory === 'ring';

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover mirror"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
      {isFace && (
        <ARFaceTryOn
          videoRef={videoRef}
          canvasRef={canvasRef}
          productCategory={productCategory as 'earrings' | 'necklace'}
          isActive={status === 'active'}
          adjustment={adjustment}
          showEarrings={comparisonMode || productCategory === 'earrings'}
          showNecklace={comparisonMode || productCategory === 'necklace'}
        />
      )}
      {isRing && (
        <ARRingTryOn
          videoRef={videoRef}
          canvasRef={canvasRef}
          isActive={status === 'active'}
          adjustment={adjustment}
        />
      )}
      <button
        onClick={stopCamera}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg text-sm"
      >
        Stop Camera
      </button>
    </>
  );
}
