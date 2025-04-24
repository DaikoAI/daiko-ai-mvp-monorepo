import { Brain, ShieldCheck, Smartphone, Zap } from "lucide-react";

const features = [
  {
    title: "AI Signal Engine",
    description:
      "Always-on agent models digest social, on-chain, and macro data to deliver entry, exit, and hedge signals tuned to your personal risk profile.",
    icon: Brain,
  },
  {
    title: "Risk Firewall",
    description:
      "Live contract screening, rug-pull heuristics, and MEV-aware routing actively defend your capital against hidden threats.",
    icon: ShieldCheck,
  },
  {
    title: "Omni-Channel Access",
    description:
      "Trade and chat seamlessly across mobile app, web dashboard, and messaging bots—one wallet, synced everywhere.",
    icon: Smartphone,
  },
  {
    title: "MEV-Optimised Flow",
    description:
      "Validator rebates and slippage savings are captured automatically and re-invested, pushing your effective cost toward zero.",
    icon: Zap,
  },
];

export function Features() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto relative pointer-events-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#E5A05C] to-[#E55C9F] bg-clip-text text-transparent mb-4">
            Why Choose Daiko AI
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Ultra-low fees and personalized crypto intelligence in one seamless experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <feature.icon className="w-12 h-12 text-[#E5A05C] mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
