"use client";

import { useCallback, useEffect, useRef } from "react";

interface DeviceMotionParams {
  /** Callback function invoked when a shake is detected. */
  onShake: () => void;
  /** Motion intensity required to trigger onShake. Higher value means less sensitive. Defaults to 15. */
  threshold?: number;
  /** Minimum time in milliseconds between shake detections. Defaults to 500ms. */
  cooldown?: number;
}

interface UseDeviceMotionResult {
  /** Function to request device motion permission (required on iOS 13+). Returns true if permission is granted or not needed, false otherwise. */
  requestPermission: () => Promise<boolean>;
}

// Type definition for DeviceMotionEvent, including the potential non-standard requestPermission method
type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

/**
 * Custom hook to detect device shaking motion.
 * Listens for device motion events and calls the onShake callback when motion exceeds the threshold.
 * Includes permission handling for iOS 13+.
 */
export function useDeviceMotion({
  onShake,
  threshold = 15,
  cooldown = 500,
}: DeviceMotionParams): UseDeviceMotionResult {
  // Refs to store previous motion data and state
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);
  const lastUpdate = useRef(0);
  const isCoolingDown = useRef(false); // Prevents rapid firing of onShake
  const listenerAttached = useRef(false); // Tracks if the event listener is active

  // Memoized handler for device motion events
  const motionHandler = useCallback(
    (event: DeviceMotionEvent) => {
      console.log(event);
      if (isCoolingDown.current) return;

      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;

      const currentTime = Date.now();
      // Debounce calls to avoid processing too frequently
      if (currentTime - lastUpdate.current > 100) {
        const diffTime = currentTime - lastUpdate.current;
        lastUpdate.current = currentTime;

        const x = accelerationIncludingGravity.x ?? 0;
        const y = accelerationIncludingGravity.y ?? 0;
        const z = accelerationIncludingGravity.z ?? 0;

        // Calculate speed based on change in acceleration
        const speed =
          (Math.abs(x + y + z - lastX.current - lastY.current - lastZ.current) / diffTime) * 10000;

        // If speed threshold is exceeded, trigger callback and cooldown
        if (speed > threshold) {
          onShake();
          isCoolingDown.current = true;
          setTimeout(() => {
            isCoolingDown.current = false;
          }, cooldown);
        }

        // Store current acceleration for next comparison
        lastX.current = x;
        lastY.current = y;
        lastZ.current = z;
      }
    },
    [onShake, threshold, cooldown], // Dependencies for the motion logic
  );

  // Memoized function to add the event listener
  const attachListener = useCallback(() => {
    if (!listenerAttached.current) {
      window.addEventListener("devicemotion", motionHandler);
      listenerAttached.current = true;
    }
  }, [motionHandler]);

  // Memoized function to remove the event listener
  const detachListener = useCallback(() => {
    if (listenerAttached.current) {
      window.removeEventListener("devicemotion", motionHandler);
      listenerAttached.current = false;
    }
  }, [motionHandler]);

  // Memoized function to handle permission request for iOS 13+
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Access DeviceMotionEvent via window object for type safety
    const MotionEvent = window.DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;

    // Check if the requestPermission method exists
    if (typeof MotionEvent?.requestPermission === "function") {
      try {
        const permissionState = await MotionEvent.requestPermission();
        if (permissionState === "granted") {
          attachListener(); // Attach listener only after permission is granted
          return true;
        }
        console.warn("Device motion permission was denied.");
        return false;
      } catch (error) {
        console.error("Error requesting device motion permission:", error);
        return false;
      }
    } else {
      // If requestPermission doesn't exist, assume not needed (e.g., Android, older iOS)
      attachListener(); // Attach listener directly
      return true;
    }
  }, [attachListener]);

  // Effect to handle attaching/detaching listener on mount/unmount
  useEffect(() => {
    // For non-iOS 13+ environments, try attaching the listener directly on mount.
    // This check determines if requestPermission API exists.
    const MotionEvent = window.DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
    if (typeof MotionEvent?.requestPermission !== "function") {
      attachListener();
    }

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      detachListener();
    };
    // Dependencies ensure attach/detach use the latest stable functions
  }, [attachListener, detachListener]);

  // Return the function needed to trigger the permission request
  return { requestPermission };
}
