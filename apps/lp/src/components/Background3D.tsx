"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useHaptic } from "use-haptic";

function Model() {
  const { scene } = useGLTF("/lucky_mallet.glb");
  const modelRef = useRef<THREE.Group | undefined>(undefined);
  const [isWobbling, setIsWobbling] = useState(false);
  const wobbleTime = useRef(0);
  const { triggerHaptic } = useHaptic();
  useFrame((state, delta) => {
    if (isWobbling && modelRef.current) {
      wobbleTime.current += delta * 12;
      const wobbleAmount = Math.sin(wobbleTime.current) * 0.04;
      modelRef.current.rotation.x = wobbleAmount;
      modelRef.current.rotation.y += delta * 0.1;

      if (wobbleTime.current > Math.PI * 0.6) {
        setIsWobbling(false);
        wobbleTime.current = 0;
        modelRef.current.rotation.x = 0;
      }
    }
  });

  const handleClick = () => {
    triggerHaptic();
    setIsWobbling(true);
    wobbleTime.current = 0;
  };

  return <primitive ref={modelRef} object={scene} onClick={handleClick} onPointerDown={handleClick} />;
}

export function Background3D() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1 }}>
      <Canvas>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model />
          </Stage>
          <OrbitControls enableZoom={false} autoRotate />
        </Suspense>
      </Canvas>
    </div>
  );
}
