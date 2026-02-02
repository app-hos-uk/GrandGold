import { Suspense } from 'react';

export default function VideoRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      {children}
    </Suspense>
  );
}
