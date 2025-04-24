import Image from "next/image";

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1 className="text-3xl font-bold text-white leading-tight flex items-center gap-2 mb-12 pointer-events-auto">
        <Image src="/icon.jpg" alt="Daiko AI" width={40} height={40} className="rounded-full" />
        Daiko
      </h1>
    </header>
  );
}
