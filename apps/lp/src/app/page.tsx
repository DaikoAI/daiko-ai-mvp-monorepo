import { GradientBackground } from "@/components/gradient-background";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <GradientBackground />
      <div className="relative z-10">
        <Hero />
        <Features />
        <Footer />
      </div>
    </main>
  );
}
