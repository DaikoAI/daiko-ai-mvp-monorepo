import { GradientBackground } from "@/components/gradient-background";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Background3D } from "@/components/background-3d";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black">
      <GradientBackground />
      <Background3D />

      <div className="relative pointer-events-none z-10">
        <Header />
        <Hero />
        <Features />
        <Footer />
      </div>
    </main>
  );
}
