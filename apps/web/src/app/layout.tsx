import { METADATA, VIEWPORT } from "@/constants";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = METADATA;
export const viewport = VIEWPORT;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${inter.className} overscroll-y-none`} cz-shortcut-listen="true">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
