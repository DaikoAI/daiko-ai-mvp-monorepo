import Image from "next/image";

export function Header() {
  return (
    <header className="flex justify-between items-center p-4 z-20 relative">
      <h1 className="pointer-events-auto">
        <Image src="/logo.png" alt="Daiko Logo" height={40} width={140} />
      </h1>
    </header>
  );
}
