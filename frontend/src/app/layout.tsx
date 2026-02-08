import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'x402 Fullstack — Conflux eSpace',
  description: 'HTTP 402 Payment Required protocol on Conflux eSpace. Multi-token, multi-method payments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="nav-bar">
          <a href="/x402-app" className="nav-logo">x402</a>
          <div className="nav-links">
            <a href="/x402-app">Demo</a>
            <a href="/x402-app/pay">API</a>
            <a href="/x402-app/history">History</a>
            <a href="/x402-app/admin">Admin</a>
            <a
              href="https://efaucet.confluxnetwork.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-faucet"
            >
              Faucet
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
