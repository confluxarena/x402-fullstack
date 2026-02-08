'use client';

import { useState, useEffect } from 'react';
import NetworkTabs from '@/components/NetworkTabs';
import { NETWORKS } from '@/lib/networks';

const SELLER_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3850';

interface Payment {
  id: number;
  tx_hash: string;
  payer: string;
  token_symbol: string;
  amount_human: string;
  payment_method: string;
  endpoint: string;
  created_at: string;
}

export default function HistoryPage() {
  const [network, setNetwork] = useState('testnet');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const net = NETWORKS[network];

  useEffect(() => {
    setLoading(true);
    fetch(`${SELLER_URL}/health`)
      .then((r) => r.json())
      .then((data) => {
        // In production, fetch from a dedicated payments API
        setPayments([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [network]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment History</h1>

      <NetworkTabs active={network} onChange={setNetwork} />

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs">
              <th className="text-left p-3">TX Hash</th>
              <th className="text-left p-3">Payer</th>
              <th className="text-left p-3">Token</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No payments yet. Try the demo on the home page.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 font-mono text-xs">
                  <a
                    href={`${net.explorerUrl}/tx/${p.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {p.tx_hash.slice(0, 10)}...
                  </a>
                </td>
                <td className="p-3 font-mono text-xs text-gray-400">
                  {p.payer.slice(0, 8)}...{p.payer.slice(-4)}
                </td>
                <td className="p-3">{p.token_symbol}</td>
                <td className="p-3">{p.amount_human}</td>
                <td className="p-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    p.payment_method === 'eip3009' ? 'bg-purple-900 text-purple-300' :
                    p.payment_method === 'native' ? 'bg-green-900 text-green-300' :
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {p.payment_method}
                  </span>
                </td>
                <td className="p-3 text-gray-500 text-xs">{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
