import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

interface TrackingState {
  headX: number; // -1 to 1, normalized
  headY: number;
  leftPinch: boolean;
  rightPinch: boolean;
  leftHandPos: { x: number; y: number; z: number } | null;
  rightHandPos: { x: number; y: number; z: number } | null;
  handsDistance: number;
  isTracking: boolean;
}

const PINCH_THRESHOLD = 0.06;

export function useMediaPipe(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [tracking, setTracking] = useState<TrackingState>({
    headX: 0,
    headY: 0,
    leftPinch: false,
    rightPinch: false,
    leftHandPos: null,
    rightHandPos: null,
    handsDistance: 0,
    isTracking: false,
  });

  const [ready, setReady] = useState(false);
  const calibrationRef = useRef({ x: 0.5, y: 0.5 });
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(-1);

  const calibrate = useCallback(() => {
    // Set current head position as center
    calibrationRef.current = {
      x: 0.5 + tracking.headX * 0.5,
      y: 0.5 + tracking.headY * 0.5,
    };
  }, [tracking.headX, tracking.headY]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      if (cancelled) return;

      const [pose, hand] = await Promise.all([
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        }),
        HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        }),
      ]);

      if (cancelled) {
        pose.close();
        hand.close();
        return;
      }

      poseLandmarkerRef.current = pose;
      handLandmarkerRef.current = hand;
      setReady(true);
    }

    init();

    return () => {
      cancelled = true;
      poseLandmarkerRef.current?.close();
      handLandmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!ready || !videoRef.current) return;

    function detect() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();
      if (now <= lastTimeRef.current) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      lastTimeRef.current = now;

      let poseResult: PoseLandmarkerResult | null = null;
      let handResult: HandLandmarkerResult | null = null;

      try {
        if (poseLandmarkerRef.current) {
          poseResult = poseLandmarkerRef.current.detectForVideo(video, now);
        }
        if (handLandmarkerRef.current) {
          handResult = handLandmarkerRef.current.detectForVideo(video, now);
        }
      } catch {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const newState: TrackingState = {
        headX: 0,
        headY: 0,
        leftPinch: false,
        rightPinch: false,
        leftHandPos: null,
        rightHandPos: null,
        handsDistance: 0,
        isTracking: false,
      };

      // Head tracking from pose nose landmark
      if (poseResult?.landmarks?.[0]?.length) {
        const nose = poseResult.landmarks[0][0];
        newState.headX = -((nose.x - calibrationRef.current.x) * 2);
        newState.headY = -((nose.y - calibrationRef.current.y) * 2);
        newState.isTracking = true;
      }

      // Hand tracking
      if (handResult?.landmarks && handResult.handedness) {
        for (let i = 0; i < handResult.landmarks.length; i++) {
          const lm = handResult.landmarks[i];
          const handedness = handResult.handedness[i]?.[0]?.categoryName;
          const thumb = lm[4];
          const index = lm[8];
          const dist = Math.sqrt(
            (thumb.x - index.x) ** 2 +
            (thumb.y - index.y) ** 2 +
            (thumb.z - index.z) ** 2
          );
          const isPinching = dist < PINCH_THRESHOLD;
          const wrist = lm[0];
          const pos = { x: wrist.x, y: wrist.y, z: wrist.z };

          // MediaPipe mirrors: "Left" in result = user's right hand visually
          if (handedness === 'Left') {
            newState.rightPinch = isPinching;
            newState.rightHandPos = pos;
          } else {
            newState.leftPinch = isPinching;
            newState.leftHandPos = pos;
          }
        }
      }

      // Distance between hands
      if (newState.leftHandPos && newState.rightHandPos) {
        newState.handsDistance = Math.sqrt(
          (newState.leftHandPos.x - newState.rightHandPos.x) ** 2 +
          (newState.leftHandPos.y - newState.rightHandPos.y) ** 2 +
          (newState.leftHandPos.z - newState.rightHandPos.z) ** 2
        );
      }

      setTracking(newState);
      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [ready, videoRef]);

  return { tracking, calibrate, ready };
}
