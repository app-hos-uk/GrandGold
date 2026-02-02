'use client';

// Register model-viewer web component
if (typeof window !== 'undefined') {
  import('@google/model-viewer');
}

interface ModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  autoRotate?: boolean;
  className?: string;
}

/**
 * Google Model Viewer - 3D model display with AR support.
 * Supports Scene Viewer (Android) and Quick Look (iOS) for native AR.
 */
export function ModelViewer({
  src,
  alt = '3D model',
  poster,
  ar = true,
  autoRotate = true,
  className = '',
}: ModelViewerProps) {
  return (
    <model-viewer
      src={src}
      alt={alt}
      poster={poster}
      ar={ar}
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      shadow-intensity="1"
      exposure="1"
      auto-rotate={autoRotate}
      className={`w-full h-full min-h-[300px] ${className}`}
      style={{ backgroundColor: 'transparent' }}
    />
  );
}
