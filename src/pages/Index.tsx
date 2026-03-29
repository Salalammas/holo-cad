import { useRef, useEffect, useState, useCallback } from 'react';
import HolographicScene from '@/components/HolographicScene';
import HudOverlay from '@/components/HudOverlay';
import WebcamPreview from '@/components/WebcamPreview';
import MicButton from '@/components/MicButton';
import OnboardingModal from '@/components/OnboardingModal';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useVoiceAssistant, ModelCommand, ModelState } from '@/hooks/useVoiceAssistant';

const BASE_SCALE = 1;
const DEFAULT_COLOR = '#00ffff';

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { tracking, calibrate, ready } = useMediaPipe(videoRef);
  const [scale, setScale] = useState(BASE_SCALE);
  const initialDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef(BASE_SCALE);
  const [started, setStarted] = useState(false);

  // Voice-controllable model state
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [wireframe, setWireframe] = useState(true);
  const [commandRotation, setCommandRotation] = useState({ x: 0, y: 0, z: 0 });

  const modelState: ModelState = {
    color,
    wireframe,
    rotationX: commandRotation.x,
    rotationY: commandRotation.y,
    rotationZ: commandRotation.z,
    scale,
  };

  const handleCommands = useCallback((cmds: ModelCommand[]) => {
    for (const cmd of cmds) {
      switch (cmd.name) {
        case 'setRotation': {
          const axis = cmd.args.axis as string;
          const degrees = cmd.args.degrees as number;
          setCommandRotation((prev) => ({ ...prev, [axis]: degrees }));
          break;
        }
        case 'setColor':
          setColor(cmd.args.hexCode as string);
          break;
        case 'toggleWireframe':
          setWireframe(cmd.args.enabled as boolean);
          break;
        case 'resetView':
          setColor(DEFAULT_COLOR);
          setWireframe(true);
          setCommandRotation({ x: 0, y: 0, z: 0 });
          setScale(BASE_SCALE);
          break;
      }
    }
  }, []);

  const { isListening, isSpeaking, cooldown, lastResponse, toggleListening } =
    useVoiceAssistant(modelState, handleCommands);

  // Start webcam only after onboarding
  useEffect(() => {
    if (!started) return;
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
  }, [started]);

  // Pinch-to-scale logic
  useEffect(() => {
    const bothPinching = tracking.leftPinch && tracking.rightPinch;

    if (bothPinching && tracking.handsDistance > 0) {
      if (initialDistRef.current === null) {
        initialDistRef.current = tracking.handsDistance;
        initialScaleRef.current = scale;
      }
      const ratio = tracking.handsDistance / initialDistRef.current;
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
        color={color}
        wireframe={wireframe}
        commandRotation={commandRotation}
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
      <MicButton
        isListening={isListening}
        isSpeaking={isSpeaking}
        cooldown={cooldown}
        lastResponse={lastResponse}
        onToggle={toggleListening}
      />
    </div>
  );
}
