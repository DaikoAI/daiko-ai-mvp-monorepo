"use client";

import { useGLTF } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useHaptic } from "use-haptic";
import useSound from "use-sound";
import CoinParticles from "./coin-particle";

export function LuckyMalletModel() {
  const modelRef = useRef<THREE.Group | null>(null);
  const wobbleTime = useRef(0);
  const [isWobbling, setIsWobbling] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const { scene } = useGLTF("/3d/lucky_mallet.glb");
  const { triggerHaptic } = useHaptic();
  const [play] = useSound("/sound/coin.mp3", { volume: 0.5 });

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
    play();
    setIsWobbling(true);
    setCoinTrigger(prev => prev + 1);
    wobbleTime.current = 0;
  };

  return (
    <>
      <primitive
        ref={modelRef}
        object={scene}
        onClick={handleClick}
        scale={1.3}
      />
      <CoinParticles trigger={coinTrigger} />
    </>
  );
}