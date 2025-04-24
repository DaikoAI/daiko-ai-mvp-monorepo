export function GradientBackground({ className }: { className?: string }) {
  return (
    <>
      {/* Primary gradient */}
      <div
        className={`fixed inset-0 opacity-40 ${className}`}
        style={{
          background:
            "linear-gradient(45deg, rgba(229, 160, 92, 0.5) 0%, rgba(229, 92, 159, 0.5) 100%)",
          filter: "blur(100px)",
        }}
      />

      {/* Animated orbs */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-[#E5A05C]/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#E57C5C]/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-[#E55C9F]/30 blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Noise texture */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
        }}
      />
    </>
  );
}
