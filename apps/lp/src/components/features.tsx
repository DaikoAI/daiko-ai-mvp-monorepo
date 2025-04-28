import { Brain, Network, ShieldCheck, Smartphone } from "lucide-react";

const features = [
  {
    title: "AI signals Network",
    description:
      "Specialized AI agents continuously gather and analyze data, collaborating to deliver personalized trading proposals tailored to your needs.",
    icon: Network,
  },
  {
    title: "AI researches. You make decisions",
    description: "Data-driven AI meets human intuition. The perfect combo for winning trades.",
    icon: Brain,
  },
  {
    title: "Personalized Proposals",
    description: "Receive custom proposals aligned with your risk profile and instructions.",
    icon: Smartphone,
  },
  {
    title: "Anti-MEV",
    description: "Protect your transactions with top-tier MEV-resistant partners.",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto relative pointer-events-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#E5A05C] to-[#E55C9F] bg-clip-text text-transparent mb-4">
            Why Choose
            <span className="text-white"> Daiko</span>
          </h2>
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
