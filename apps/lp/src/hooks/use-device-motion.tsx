"use client";

import { useState, useEffect } from "react";

interface DeviceMotionState {
  isShaking: boolean;
  acceleration: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
}

export function useDeviceMotion(threshold = 15): DeviceMotionState {
  const [motion, setMotion] = useState<DeviceMotionState>({
    isShaking: false,
    acceleration: { x: null, y: null, z: null },
  });

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastUpdate = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;

      if (!current) return;

      const currentTime = new Date().getTime();

      if (currentTime - lastUpdate > 100) {
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;

        const x = current.x || 0;
        const y = current.y || 0;
        const z = current.z || 0;

        const speed = (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;

        if (speed > threshold) {
          setMotion({
            isShaking: true,
            acceleration: { x, y, z },
          });

          // Reset shaking state after a short delay
          setTimeout(() => {
            setMotion((prev) => ({
              ...prev,
              isShaking: false,
            }));
          }, 1000);
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    // Request permission for device motion (for iOS 13+)
    const requestPermission = async () => {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        try {
          const permissionState = await (DeviceMotionEvent as any).requestPermission();
          if (permissionState === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        } catch (error) {
          console.error("Error requesting device motion permission:", error);
        }
      } else {
        // For non-iOS devices or older iOS versions
        window.addEventListener("devicemotion", handleMotion);
      }
    };

    // Try to add the event listener directly, and if it fails (on iOS), request permission
    try {
      window.addEventListener("devicemotion", handleMotion);
    } catch (error) {
      requestPermission();
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [threshold]);

  return motion;
}
