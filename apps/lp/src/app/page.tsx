import { Background3D } from "@/components/Background3D";
import { WaitListForm } from "@/components/WaitListForm";
import { AuroraText } from "@/components/magicui/aurora-text";

export default function Home() {
  return (
    <main className="p-3">
      <Background3D />

      <h1 className="text-4xl font-bold text-center p-4">
        Daiko
        <AuroraText colors={["#E5A05C", "#E57C5C", "#E55C7C", "#E55C9F"]}>Exit Strategy Assistant</AuroraText>
      </h1>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div
          className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10
          shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(251,191,36,0.25)] transition-all duration-500"
        >
          <h2 className="text-xl font-semibold mb-4">Join the Waitlist</h2>
          <WaitListForm />
        </div>
      </div>
    </main>
  );
}
