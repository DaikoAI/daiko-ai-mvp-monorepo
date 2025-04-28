import { VideoPlayer } from "@/components/video-player";
import { Suspense } from "react";
import { WaitListForm } from "./waitlist-form";

export function Hero() {
  return (
    <section className="relative min-h-screen">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-6 text-center relative min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-80 md:mb-120 pointer-events-auto mt-4">
            <span className="bg-gradient-to-r from-[#E5A05C] via-[#E57C5C] to-[#E55C9F] bg-clip-text text-transparent">
              Vibe Trading App
            </span>
          </h1>

          <p className="text-md mb-12 text-white/80 pointer-events-auto">
            1-click portfolio moves with sell signals from Agents. No constant monitoring or Twitter
            scrolling required&mdash;Daiko delivers personalized trading strategies optimized just
            for you.
          </p>

          <div className="relative w-full max-w-md mx-auto mt-12 mb-24 pointer-events-auto">
            <div
              className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10
          shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(251,191,36,0.25)] transition-all duration-500"
            >
              <h2 className="text-xl font-semibold mb-4">Join the Waitlist</h2>
              <WaitListForm />
            </div>
          </div>

          <div className="space-y-10 mb-12 pointer-events-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
              <div className="space-x-4">
                <h3 className="font-semibold text-white mb-1 text-xl md:text-2xl">
                  Just hit Accept or Decline
                </h3>
                <p className="text-white/70 text-sm">
                  AI monitors your portfolio and gives you personalized proposals.
                </p>
              </div>
              <div className="flex-shrink-0 w-2/3 mx-auto md:w-1/3 md:mx-0">
                <Suspense
                  fallback={
                    <div className="w-2/3 mx-auto md:w-full h-[400px] bg-gray-700/50 animate-pulse rounded-xl" />
                  }
                >
                  <VideoPlayer src="/video/vibe-trade-demo.webm" className="rounded-xl shadow-l" />
                </Suspense>
              </div>
            </div>

            {/* <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:gap-6 text-center md:text-left">
              <div className="space-x-4">
                <h3 className="font-semibold text-white mb-1 text-xl md:text-2xl">
                  Talk Trading for Pros
                </h3>
                <p className="text-white/70 text-sm">
                  Understand the &ldquo;why&rdquo; behind every proposal with sources and smart
                  chats
                </p>
              </div>
              <div className="flex-shrink-0 w-2/3 mx-auto md:w-1/3 md:order-first md:mx-0">
                <Suspense
                  fallback={
                    <div className="w-2/3 mx-auto md:w-full h-[400px] bg-gray-700/50 animate-pulse rounded-xl" />
                  }
                >
                  <VideoPlayer
                    src="/video/ask-ai-demo.mp4"
                    className="rounded-xl aspect-[9/19.5]"
                  />
                </Suspense>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
}
