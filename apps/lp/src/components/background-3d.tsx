"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useHaptic } from "use-haptic";
import { useSound } from 'use-sound'
import { coinConfig, getRandomCoinModelIndex } from './coinConfig';
import * as THREE from "three";

// We'll manage coins imperatively for performance

function CoinParticles({ trigger }: { trigger: number }) {
  // Load coin GLTF model scenes once
  const gltf1 = useGLTF(coinConfig.glbPaths[0]);
  const gltf2 = useGLTF(coinConfig.glbPaths[1]);
  const gltf3 = useGLTF(coinConfig.glbPaths[2]);
  const gltf4 = useGLTF(coinConfig.glbPaths[3]);
  const gltf5 = useGLTF(coinConfig.glbPaths[4]);
  const templates: THREE.Group[] = [
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

  // Single useFrame to animate all coins
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
    // Generate new batch
    const newCoins: Coin[] = Array.from({ length: coinConfig.batchCount }).map(() => {
      const id = coinIdRef.current++;
      const idx = getRandomCoinModelIndex();
      const object = templates[idx].clone(true) as THREE.Group;
      object.position.set(
        (Math.random() - 0.5) * coinConfig.spawnRange,
        coinConfig.spawnHeight,
        (Math.random() - 0.5) * coinConfig.spawnRange
      );
      // add to group
      groupRef.current!.add(object);
      return {
        id,
        object,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          - (0.02 + Math.random() * 0.02),
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
    // push into ref
    coinsRef.current.push(...newCoins);
    // schedule removal
    setTimeout(() => {
      newCoins.forEach(coin => {
        groupRef.current!.remove(coin.object);
      });
      coinsRef.current = coinsRef.current.filter(c => !newCoins.some(nc => nc.id === c.id));
    }, coinConfig.lifetime);
  }, [trigger]);

  // Render a single group for all coins
  return <group ref={groupRef} />;
}

function Model() {
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
          zIndex: 0,
          pointerEvents: "all"
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
              autoRotateSpeed={4}
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
