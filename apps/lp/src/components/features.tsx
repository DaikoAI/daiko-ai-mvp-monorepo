import { BarChart3, Brain, Target, TrendingUp } from "lucide-react"

const features = [
  {
    title: "AI-Powered Analysis",
    description: "Accurately evaluate your business value using cutting-edge AI technology powered by lucky_mallet.",
    icon: Brain,
  },
  {
    title: "Market Intelligence",
    description: "Analyze industry trends and market opportunities to identify the optimal timing for your exit.",
    icon: BarChart3,
  },
  {
    title: "Strategic Matching",
    description: "Find the perfect buyer and propose strategies to maximize synergy effects.",
    icon: Target,
  },
  {
    title: "Value Maximization",
    description: "Suggest concrete measures to enhance corporate value and achieve the best possible exit price.",
    icon: TrendingUp,
  },
]

export function Features() {
  return (
    <section className="py-24 px-4 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 z-10">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#E5A05C] to-[#E55C9F] bg-clip-text text-transparent mb-4">
            Why Choose Daiko AI
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Combining state-of-the-art AI technology with expert knowledge to maximize your business value.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <feature.icon className="w-12 h-12 text-[#E5A05C] mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}