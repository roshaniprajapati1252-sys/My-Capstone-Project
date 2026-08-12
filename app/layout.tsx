import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OUTPUT.",
  description: "Personal agent — Google Workspace + Telegram, in one place.",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/docs", label: "Docs" },
  { href: "/gmail", label: "Gmail" },
  { href: "/calendar", label: "Calendar" },
  { href: "/drive", label: "Drive" },
  { href: "/telegram", label: "Telegram" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-[#0A1220] text-[#EDEFF3] font-[family-name:var(--font-inter)] antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-[#1B3A6B]">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
              <Link
                href="/"
                className="flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] text-lg font-semibold tracking-tight"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 2H8" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M2 2V8" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M26 2H20" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M26 2V8" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M2 26H8" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M2 26V20" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M26 26H20" stroke="#C89B3C" strokeWidth="1.5" />
                  <path d="M26 26V20" stroke="#C89B3C" strokeWidth="1.5" />
                  <text
                    x="14"
                    y="19"
                    textAnchor="middle"
                    fill="#EDEFF3"
                    fontSize="14"
                    fontFamily="var(--font-space-grotesk)"
                  >
                    R.
                  </text>
                </svg>
                OUTPUT.
              </Link>
              <nav className="hidden gap-6 sm:flex">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-[family-name:var(--font-ibm-plex-mono)] text-sm text-[#EDEFF3]/80 transition-colors hover:text-[#C89B3C]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <nav className="flex flex-wrap gap-4 border-t border-[#1B3A6B] px-4 py-2 sm:hidden">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-[#EDEFF3]/80 transition-colors hover:text-[#C89B3C]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}