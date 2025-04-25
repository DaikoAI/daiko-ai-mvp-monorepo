import { Background3D } from "@/components/background-3d";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { GradientBackground } from "@/components/gradient-background";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black">
      <GradientBackground />
      <Background3D />

      <Header />

      <div className="relative pointer-events-none z-10">
        <Hero />
        <Features />
        <Footer />
      </div>
    </main>
  );
}
