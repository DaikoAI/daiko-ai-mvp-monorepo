"use client";

import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useA2HS } from "@/hooks/useA2H";
import Image from "next/image";
import { useState } from "react";

interface InstallDrawerProps {
  children?: React.ReactNode;
}

export const InstallDrawer: React.FC<InstallDrawerProps> = ({ children }) => {
  const { promptEvent, promptToInstall } = useA2HS();
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleInstall = async () => {
    if (!promptEvent) {
      return;
    }

    setIsInstalling(true);

    try {
      await promptToInstall();
      setIsInstalling(false);
    } catch (error) {
      console.error("インストール中にエラーが発生しました:", error);
      setIsInstalling(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="h-[50vh] rounded-t-xl">
        <div className="px-4 py-6 flex flex-col items-center justify-center h-full text-center">
          <DrawerTitle className="sr-only">Install DAIKO App</DrawerTitle>
          <DrawerDescription className="sr-only">Instructions to install DAIKO app on your device</DrawerDescription>
          <div className="w-16 h-16 mb-4 bg-black rounded-2xl flex items-center justify-center">
            <Image src="/icon.jpg" alt="Daiko Logo" width={50} height={50} />
          </div>

          <h2 className="text-2xl font-bold mb-1">Install DAIKO</h2>
          <p className="text-gray-500 mb-6 text-sm">Add the app to your home screen</p>

          <div className="w-full space-y-5">
            <div className="flex flex-col items-center">
              <p className="text-base font-semibold flex items-center">
                Tap the{" "}
                <span className="inline-flex items-center">
                  <svg
                    className="w-5 h-5 mx-1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{" "}
                share icon in your browser
              </p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-base font-semibold flex items-center">
                Select{" "}
                <span className="inline-flex items-center">
                  <svg
                    className="w-5 h-5 mx-1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </span>{" "}
                Add to Home Screen
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
