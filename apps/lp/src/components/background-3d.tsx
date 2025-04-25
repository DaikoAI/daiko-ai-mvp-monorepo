"use client";

import { Stage } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
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
        <Canvas
          onDrag={(event) => {
            event.stopPropagation();
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <Suspense fallback={null}>
            <Stage intensity={0.6} adjustCamera={false}>
              <LuckyMalletModel />
            </Stage>
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}
