import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

interface HoloBoxProps {
  headX: number;
  headY: number;
  scale: number;
}

function HoloBox({ headX, headY, scale }: HoloBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Smooth parallax rotation based on head position
    targetRotation.current.y = headX * 0.6;
    targetRotation.current.x = headY * 0.4;

    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * delta * 3;
    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * delta * 3;

    // Idle rotation
    meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial transparent opacity={0} />
      <Edges
        threshold={15}
        color="#00ffff"
      />
      {/* Glow layer */}
      <mesh scale={[1.02, 1.02, 1.02]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial
          color="#00ffff"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </mesh>
  );
}

function GridFloor() {
  return (
    <gridHelper
      args={[20, 20, '#00ffff', '#004444']}
      position={[0, -2.5, 0]}
    />
  );
}

interface HolographicSceneProps {
  headX: number;
  headY: number;
  scale: number;
}

export default function HolographicScene({ headX, headY, scale }: HolographicSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1, 6], fov: 50 }}
      style={{ background: '#000000', width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
    >
      <ambientLight intensity={0.1} />
      <HoloBox headX={headX} headY={headY} scale={scale} />
      <GridFloor />
    </Canvas>
  );
}
