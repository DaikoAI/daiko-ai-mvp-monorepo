"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls } from "@react-three/drei";
import { LuckyMalletModel } from "./lucky-mallet-model";

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
          pointerEvents: "none",
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
          pointerEvents: "all",
        }}
      >
        <Canvas>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6} adjustCamera={false}>
              <LuckyMalletModel />
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
