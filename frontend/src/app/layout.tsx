import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'x402 Fullstack — Conflux eSpace',
  description: 'HTTP 402 Payment Required protocol on Conflux eSpace. Multi-token, multi-method payments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-white">
              x402 <span className="text-blue-400">Fullstack</span>
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="text-gray-400 hover:text-white transition">Demo</a>
              <a href="/history" className="text-gray-400 hover:text-white transition">History</a>
              <a href="/admin" className="text-gray-400 hover:text-white transition">Admin</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
