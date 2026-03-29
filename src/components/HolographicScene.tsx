import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

interface HoloModelProps {
  headX: number;
  headY: number;
  scale: number;
  color: string;
  wireframe: boolean;
  commandRotation: { x: number; y: number; z: number };
}

function HoloModel({ headX, headY, scale, color, wireframe, commandRotation }: HoloModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  const geometry = useLoader(STLLoader, '/models/piston_rod.stl');

  const centeredGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.center();
    geo.computeBoundingBox();
    return geo;
  }, [geometry]);

  const autoScale = useMemo(() => {
    const box = new THREE.Box3().setFromBufferAttribute(
      centeredGeometry.getAttribute('position') as THREE.BufferAttribute
    );
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    return maxDim > 0 ? 5 / maxDim : 1;
  }, [centeredGeometry]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Head-tracking parallax
    targetRotation.current.y = headX * 0.6 + THREE.MathUtils.degToRad(commandRotation.y);
    targetRotation.current.x = headY * 0.4 + THREE.MathUtils.degToRad(commandRotation.x);

    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * delta * 3;
    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * delta * 3;
    meshRef.current.rotation.z = THREE.MathUtils.degToRad(commandRotation.z);
    meshRef.current.rotation.y += delta * 0.15;
  });

  const finalScale = autoScale * scale;

  return (
    <mesh ref={meshRef} geometry={centeredGeometry} scale={[finalScale, finalScale, finalScale]} position={[0, 0, 0]}>
      <meshBasicMaterial
        color={color}
        wireframe={wireframe}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function GridFloor() {
  return (
    <gridHelper
      args={[20, 20, '#00ffff', '#004444']}
      position={[0, -3, 0]}
    />
  );
}

interface HolographicSceneProps {
  headX: number;
  headY: number;
  scale: number;
  color: string;
  wireframe: boolean;
  commandRotation: { x: number; y: number; z: number };
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0, -1, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

export default function HolographicScene({ headX, headY, scale, color, wireframe, commandRotation }: HolographicSceneProps) {
  return (
    <Canvas
      style={{ background: '#000000', width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
    >
      <CameraSetup />
      <ambientLight intensity={0.1} />
      <HoloModel headX={headX} headY={headY} scale={scale} color={color} wireframe={wireframe} commandRotation={commandRotation} />
      <GridFloor />
    </Canvas>
  );
}
