import { WaitListForm } from "@/components/waitlist-form";

export function Hero() {
  return (
    <section className="relative min-h-screen">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-3 text-center relative min-h-screen">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-72 pointer-events-auto">
            <span className="bg-gradient-to-r from-[#E5A05C] via-[#E57C5C] to-[#E55C9F] bg-clip-text text-transparent">
              Exit Strategy Assistant
            </span>
          </h1>
          <p className="text-md mb-10 text-white/80 pointer-events-auto">
            An AI-powered trading assistant for busy investors. No constant monitoring or Twitter
            scrolling required&mdash;Daiko delivers personalized trading strategies optimized just
            for you.
          </p>

          <div className="space-y-6 mb-8 pointer-events-auto">
            <div className="flex items-start space-x-4 text-left">
              <div className="w-10 h-10 rounded-full bg-[#E5A05C]/20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-[#E5A05C]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Vibe Trading for Beginners</h3>
                <p className="text-white/70 text-sm">
                  Just hit Accept or Decline. AI monitors your portfolio and gives you personalized
                  proposals.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-left">
              <div className="w-10 h-10 rounded-full bg-[#E55C9F]/20 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-[#E55C9F]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Talk Trading for Pros</h3>
                <p className="text-white/70 text-sm">
                  Understand the &ldquo;why&rdquo; behind every proposal with sources and smart
                  chats
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-md mx-auto mt-8 mb-24 pointer-events-auto">
            <div
              className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10
          shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(251,191,36,0.25)] transition-all duration-500"
            >
              <h2 className="text-xl font-semibold mb-4">Join the Waitlist</h2>
              <WaitListForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
