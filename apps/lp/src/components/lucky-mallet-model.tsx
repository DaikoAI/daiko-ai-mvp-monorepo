"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useHaptic } from "use-haptic";
import useSound from "use-sound";
import { CoinParticles } from "./coin-particle";

export function LuckyMalletModel() {
  const modelRef = useRef<THREE.Group | null>(null);
  const wobbleTime = useRef(0);

  const [isWobbling, setIsWobbling] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [isFever, setIsFever] = useState(false);

  const { scene } = useGLTF("/3d/lucky_mallet.glb");
  const { triggerHaptic } = useHaptic();
  const [play] = useSound("/sound/coin.mp3", { volume: 0.5 });

  const autoRotateSpeed = 0.5; // Adjust rotation speed as needed

  useFrame((state, delta) => {
    if (isWobbling && modelRef.current) {
      wobbleTime.current += delta * 12;
      const wobbleAmount = Math.sin(wobbleTime.current) * 0.04;
      modelRef.current.rotation.x = wobbleAmount;

      if (wobbleTime.current > Math.PI * 0.6) {
        setIsWobbling(false);
        wobbleTime.current = 0;
        modelRef.current.rotation.x = 0;
      }
    }

    // Auto-rotate the model on the Y-axis
    if (modelRef.current) {
      const rotationMultiplier = isFever ? -20 : 1; // Fever makes it spin faster (adjust multiplier)
      modelRef.current.rotation.y += delta * autoRotateSpeed * rotationMultiplier;
    }
  });

  useEffect(() => {
    if (!modelRef.current) return;
    // Calculate emissive intensity based on gauge or fever
    const intensity = isFever ? 1 : tapCount / 20;
    modelRef.current.traverse((child: THREE.Object3D) => {
      // Only update meshes with standard material
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissive = new THREE.Color(1, 1, 0);
        material.emissiveIntensity = intensity;
      }
    });
  }, [tapCount, isFever]);

  const handleClick = () => {
    triggerHaptic();
    play();
    setIsWobbling(true);
    setCoinTrigger((prev) => prev + 1);
    wobbleTime.current = 0;
    if (!isFever) {
      if (tapCount + 1 >= 20) {
        setIsFever(true);
        setTapCount(0);
        setTimeout(() => {
          setIsFever(false);
          setTapCount(0);
        }, 10000);
      } else {
        setTapCount(tapCount + 1);
      }
    }
  };

  return (
    <>
      <primitive ref={modelRef} object={scene} onClick={handleClick} scale={1.3} />
      <Suspense fallback={null}>
        <CoinParticles trigger={coinTrigger} fever={isFever} />
      </Suspense>
    </>
  );
}
