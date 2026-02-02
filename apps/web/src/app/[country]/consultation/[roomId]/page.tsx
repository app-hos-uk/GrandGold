'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Square } from 'lucide-react';
import { api } from '@/lib/api';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function VideoConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const roomId = params.roomId as string;
  const isExpert = searchParams.get('expert') === '1';

  const [room, setRoom] = useState<{ roomId: string; date: string; slot: string } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'connecting' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'caller' | 'callee'>('caller');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const signalIndexRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        api.post(`/api/consultation/room/${roomId}/signal`, {
          type: 'ice',
          data: e.candidate.toJSON(),
        }).catch(() => {});
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    pcRef.current = pc;
    return pc;
  }, [roomId]);

  const startAsCaller = useCallback(async () => {
    try {
      const pc = createPeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await api.post(`/api/consultation/room/${roomId}/signal`, {
        type: 'offer',
        data: offer,
      });
      setStatus('connecting');
    } catch {
      setError('Could not access camera or microphone. Please check permissions.');
      setStatus('error');
    }
  }, [roomId, createPeerConnection]);

  const pollForSignals = useCallback(async () => {
    try {
      const res = await api.get<{ signals: { type: string; data: unknown }[]; index: number }>(
        `/api/consultation/room/${roomId}/signal?after=${signalIndexRef.current}`
      );
      const signals = res?.signals ?? [];
      signalIndexRef.current = res?.index ?? signalIndexRef.current;

      for (const sig of signals) {
        if (sig.type === 'offer' && role === 'callee') {
          try {
            const pc = createPeerConnection();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            await pc.setRemoteDescription(new RTCSessionDescription(sig.data as RTCSessionDescriptionInit));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await api.post(`/api/consultation/room/${roomId}/signal`, { type: 'answer', data: answer });
            setStatus('connected');
          } catch {
            setError('Could not access camera or microphone.');
            setStatus('error');
          }
        } else if (sig.type === 'answer' && role === 'caller') {
          const pc = pcRef.current;
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.data as RTCSessionDescriptionInit));
            setStatus('connected');
          }
        } else if (sig.type === 'ice') {
          const pc = pcRef.current;
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(sig.data as RTCIceCandidateInit));
          }
        }
      }
    } catch {
      // ignore poll errors
    }
  }, [roomId, role, createPeerConnection]);

  useEffect(() => {
    if (!roomId) return;

    api
      .get<{ roomId: string; date: string; slot: string }>(`/api/consultation/room/${roomId}`)
      .then((data) => {
        setRoom(data);
        setStatus('ready');
        setRole(isExpert ? 'callee' : 'caller');
        if (!isExpert) startAsCaller();
        else setStatus('connecting');
      })
      .catch((err) => {
        setError('Room not found or expired.');
        setStatus('error');
      });
  }, [roomId]);

  useEffect(() => {
    if (status === 'connecting' || status === 'ready') {
      pollRef.current = setInterval(pollForSignals, 1500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, pollForSignals]);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current || !localStreamRef.current) return;
    try {
      if (screenSharing) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setScreenSharing(false);
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = displayStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current = new MediaStream([...localStreamRef.current.getAudioTracks(), videoTrack]);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        videoTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
      }
    } catch {
      // Screen share cancelled or failed - silently ignore
    }
  }, [screenSharing]);

  const toggleRecording = useCallback(() => {
    if (!remoteVideoRef.current?.srcObject) return;
    const stream = remoteVideoRef.current.srcObject as MediaStream;
    if (recording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    } else {
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consultation-${roomId}-${Date.now()}.webm`;
        a.click();
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    }
  }, [recording, roomId]);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current?.stop();
    };
  }, []);

  if (status === 'loading' || status === 'error') {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Link
            href={`/${country}/consultation`}
            className="px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
          >
            Back to Consultation
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1 relative rounded-xl overflow-hidden bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 rounded text-white text-sm">
            Expert
          </div>
        </div>
        <div className="w-full md:w-80 relative rounded-xl overflow-hidden bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 rounded text-white text-sm">
            You
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-800 flex justify-center gap-4">
        <button
          onClick={() => {
            setVideoEnabled((v) => !v);
            localVideoRef.current?.srcObject &&
              (localVideoRef.current.srcObject as MediaStream).getVideoTracks().forEach((t) => (t.enabled = !videoEnabled));
          }}
          className={`p-3 rounded-full ${videoEnabled ? 'bg-gray-600' : 'bg-red-500'} text-white`}
        >
          {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
        <button
          onClick={() => {
            setAudioEnabled((a) => !a);
            localVideoRef.current?.srcObject &&
              (localVideoRef.current.srcObject as MediaStream).getAudioTracks().forEach((t) => (t.enabled = !audioEnabled));
          }}
          className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-600' : 'bg-red-500'} text-white`}
        >
          {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${screenSharing ? 'bg-gold-500' : 'bg-gray-600'} text-white`}
          title={screenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor className="w-6 h-6" />
        </button>
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full ${recording ? 'bg-red-500' : 'bg-gray-600'} text-white`}
          title={recording ? 'Stop recording' : 'Record call'}
        >
          <Square className="w-6 h-6" />
        </button>
        <button
          onClick={() => router.push(`/${country}/consultation`)}
          className="p-3 rounded-full bg-red-500 text-white"
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      <p className="text-center text-gray-400 text-sm pb-4">
        {room && `Room: ${room.roomId} • ${room.date} at ${room.slot}`}
      </p>
    </main>
  );
}
