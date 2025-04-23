"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useHaptic } from "use-haptic";

function Model() {
  const { scene } = useGLTF("/lucky_mallet.glb");
  const modelRef = useRef<THREE.Group | null>(null);
  const [isWobbling, setIsWobbling] = useState(false);
  const [hovered, setHovered] = useState(false);
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

  return (
    <primitive
      ref={modelRef}
      object={scene}
      onClick={handleClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
        setHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        setHovered(false);
      }}
      scale={hovered ? 1.1 : 1}
    />
  );
}

export function Background3D() {
  return (
    <>
      {/* Background overlay to handle pointer events for content */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none"
        }}
      />
      {/* 3D Canvas container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          cursor: "auto"
        }}
      >
        <Canvas>
          <Suspense fallback={null}>
            <Stage
              environment="city"
              intensity={0.6}
              adjustCamera={false}
            >
              <Model />
            </Stage>
            <OrbitControls
              enableZoom={false}
              autoRotate
              autoRotateSpeed={0.5}
              enablePan={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 3}
            />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}
