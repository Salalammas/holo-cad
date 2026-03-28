import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

interface HoloModelProps {
  headX: number;
  headY: number;
  scale: number;
}

function HoloModel({ headX, headY, scale }: HoloModelProps) {
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
    targetRotation.current.y = headX * 0.6;
    targetRotation.current.x = headY * 0.4;

    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * delta * 3;
    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * delta * 3;
    meshRef.current.rotation.y += delta * 0.15;
  });

  const finalScale = autoScale * scale;

  return (
    <mesh ref={meshRef} geometry={centeredGeometry} scale={[finalScale, finalScale, finalScale]}>
      <meshBasicMaterial
        color="#00ffff"
        wireframe
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
      <HoloModel headX={headX} headY={headY} scale={scale} />
      <GridFloor />
    </Canvas>
  );
}
