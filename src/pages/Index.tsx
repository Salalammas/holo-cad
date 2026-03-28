import { useRef, useEffect, useState, useCallback } from 'react';
import HolographicScene from '@/components/HolographicScene';
import HudOverlay from '@/components/HudOverlay';
import WebcamPreview from '@/components/WebcamPreview';
import { useMediaPipe } from '@/hooks/useMediaPipe';

const BASE_SCALE = 1;
const SCALE_MULTIPLIER = 3;

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { tracking, calibrate, ready } = useMediaPipe(videoRef);
  const [scale, setScale] = useState(BASE_SCALE);
  const initialDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef(BASE_SCALE);

  // Start webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    }
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Pinch-to-scale logic
  useEffect(() => {
    const bothPinching = tracking.leftPinch && tracking.rightPinch;

    if (bothPinching && tracking.handsDistance > 0) {
      if (initialDistRef.current === null) {
        initialDistRef.current = tracking.handsDistance;
        initialScaleRef.current = scale;
      }
      const ratio = tracking.handsDistance / initialDistRef.current;
      const newScale = Math.max(0.3, Math.min(5, initialScaleRef.current * ratio * SCALE_MULTIPLIER / SCALE_MULTIPLIER * ratio));
      setScale(initialScaleRef.current * ratio);
    } else {
      initialDistRef.current = null;
    }
  }, [tracking.leftPinch, tracking.rightPinch, tracking.handsDistance]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <HolographicScene
        headX={tracking.headX}
        headY={tracking.headY}
        scale={scale}
      />
      <HudOverlay
        isTracking={tracking.isTracking}
        ready={ready}
        headX={tracking.headX}
        headY={tracking.headY}
        leftPinch={tracking.leftPinch}
        rightPinch={tracking.rightPinch}
        scale={scale}
        onCalibrate={calibrate}
      />
      <WebcamPreview ref={videoRef} isTracking={tracking.isTracking} />
    </div>
  );
}
