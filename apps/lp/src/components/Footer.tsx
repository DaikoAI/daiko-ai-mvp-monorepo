export function Footer({ className }: { className?: string }) {
  return (
    <footer className={`text-center text-sm p-4 ${className}`}>
      <p>&copy; 2024 Daiko AI. All rights reserved.</p>
    </footer>
  );
}
