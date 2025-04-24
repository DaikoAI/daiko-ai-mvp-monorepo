"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { coinConfig, getRandomCoinModelIndex } from "./coinConfig";

export default function CoinParticles({ trigger }: { trigger: number }) {
  // Load each coin model via useGLTF to satisfy hook rules
  const [path0, path1, path2, path3, path4, path5] = coinConfig.glbPaths;
  const gltf0 = useGLTF(path0);
  const gltf1 = useGLTF(path1);
  const gltf2 = useGLTF(path2);
  const gltf3 = useGLTF(path3);
  const gltf4 = useGLTF(path4);
  const gltf5 = useGLTF(path5);
  const templates: THREE.Group[] = [
    gltf0.scene,
    gltf1.scene,
    gltf2.scene,
    gltf3.scene,
    gltf4.scene,
    gltf5.scene,
  ];

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
    coinsRef.current.forEach(coin => {
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
      const idx = getRandomCoinModelIndex();
      const template = templates[idx];
      const object = template.clone(true) as THREE.Group;
      object.position.set(
        (Math.random() - 0.5) * coinConfig.spawnRange,
        coinConfig.spawnHeight,
        (Math.random() - 0.5) * coinConfig.spawnRange
      );
      groupRef.current!.add(object);
      return {
        id,
        object,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          -(0.02 + Math.random() * 0.02),
          (Math.random() - 0.5) * 0.1
        ),
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.2
        },
        wobblePhase: Math.random() * 2 * Math.PI,
      };
    });
    coinsRef.current.push(...newCoins);
    // Schedule removal after lifetime
    setTimeout(() => {
      newCoins.forEach(coin => groupRef.current!.remove(coin.object));
      coinsRef.current = coinsRef.current.filter(c => !newCoins.some(nc => nc.id === c.id));
    }, coinConfig.lifetime);
  }, [trigger]);

  return <group ref={groupRef} />;
}