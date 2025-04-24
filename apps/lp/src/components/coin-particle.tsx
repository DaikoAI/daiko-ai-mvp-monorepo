"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { coinConfig, getRandomCoinModelIndex } from "./coin-config";

export default function CoinParticles({ trigger, fever }: { trigger: number; fever: boolean }) {
  // Load each coin model via useGLTF to satisfy hook rules
  const gltfBTC = useGLTF(coinConfig.coins[0].glbPath);
  const gltfUSDC = useGLTF(coinConfig.coins[1].glbPath);
  const gltfJITO = useGLTF(coinConfig.coins[2].glbPath);
  const gltfJUP = useGLTF(coinConfig.coins[3].glbPath);
  const gltfSOL = useGLTF(coinConfig.coins[4].glbPath);
  const gltfINF = useGLTF(coinConfig.coins[5].glbPath);
  const gltfDAIKO = useGLTF(coinConfig.coins[6].glbPath);
  const templates: THREE.Group[] = [
    gltfBTC.scene,
    gltfUSDC.scene,
    gltfJITO.scene,
    gltfJUP.scene,
    gltfSOL.scene,
    gltfINF.scene,
    gltfDAIKO.scene,
  ];
  // Index of daiko coin for fever mode
  const daikoIndex = coinConfig.coins.findIndex((coin) => coin.glbPath.includes("daiko.glb"));

  // Imperative coin list
  type Coin = {
    id: number;
    object: THREE.Group;
    velocity: THREE.Vector3;
    rotationSpeed: { x: number; y: number; z: number };
    wobblePhase: number;
  };
  const coinsRef = useRef<Coin[]>([]);
  const coinIdRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  // Animate all coins in a single frame loop
  useFrame((state, delta) => {
    coinsRef.current.forEach((coin) => {
      const { object, velocity, rotationSpeed, wobblePhase } = coin;
      const t = state.clock.getElapsedTime();
      const wobbleX = Math.sin(t * 1.5 + wobblePhase) * 0.02;
      const wobbleZ = Math.cos(t * 1.2 + wobblePhase) * 0.02;
      object.position.x += velocity.x + wobbleX;
      object.position.y += velocity.y;
      object.position.z += velocity.z + wobbleZ;
      object.rotation.x += delta * rotationSpeed.x;
      object.rotation.y += delta * rotationSpeed.y;
      object.rotation.z += delta * rotationSpeed.z;
    });
  });

  useEffect(() => {
    // Skip initial mount
    if (trigger < 1 || !groupRef.current) return;
    // Generate and add new coin batch
    const newCoins: Coin[] = Array.from({ length: coinConfig.batchCount }).map(() => {
      const id = coinIdRef.current++;
      // Choose daiko coin during fever or random otherwise
      const idx = fever && daikoIndex >= 0 ? daikoIndex : getRandomCoinModelIndex();
      const template = templates[idx];
      const object = template.clone(true) as THREE.Group;
      // Apply configured scale
      const scale = coinConfig.coins[idx].scale;
      object.scale.set(scale[0], scale[1], scale[2]);
      object.position.set(
        (Math.random() - 0.5) * coinConfig.spawnRange,
        coinConfig.spawnHeight,
        (Math.random() - 0.5) * coinConfig.spawnRange,
      );
      groupRef.current!.add(object);
      return {
        id,
        object,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          -(0.02 + Math.random() * 0.02),
          (Math.random() - 0.5) * 0.1,
        ),
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.2,
        },
        wobblePhase: Math.random() * 2 * Math.PI,
      };
    });
    coinsRef.current.push(...newCoins);
    // Schedule removal after lifetime
    setTimeout(() => {
      newCoins.forEach((coin) => groupRef.current!.remove(coin.object));
      coinsRef.current = coinsRef.current.filter((c) => !newCoins.some((nc) => nc.id === c.id));
    }, coinConfig.lifetime);
  }, [trigger, fever]);

  return <group ref={groupRef} />;
}
