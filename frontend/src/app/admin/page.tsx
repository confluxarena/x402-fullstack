'use client';

import { useState, useEffect } from 'react';
import NetworkTabs from '@/components/NetworkTabs';
import { NETWORKS } from '@/lib/networks';

const SELLER_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3850';

interface HealthData {
  status: string;
  network: string;
  chainId: number;
  seller: string;
  tokens: string[];
}

export default function AdminPage() {
  const [network, setNetwork] = useState('testnet');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [sellerOk, setSellerOk] = useState<boolean | null>(null);
  const [facilitatorOk, setFacilitatorOk] = useState<boolean | null>(null);

  const net = NETWORKS[network];

  useEffect(() => {
    // Check seller health
    fetch(`${SELLER_URL}/health`)
      .then((r) => r.json())
      .then((data) => {
        setHealth(data);
        setSellerOk(true);
      })
      .catch(() => setSellerOk(false));

    // Facilitator is internal, seller proxies it
    setFacilitatorOk(null);
  }, [network]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <NetworkTabs active={network} onChange={setNetwork} />

      {/* Service status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatusCard title="Seller API" ok={sellerOk} url={SELLER_URL} />
        <StatusCard title="Facilitator" ok={facilitatorOk} url="Internal :3849" />
        <StatusCard title="Database" ok={sellerOk} url="PostgreSQL 16" />
      </div>

      {/* Network info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Network Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Network</span>
            <p className="text-white">{net.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Chain ID</span>
            <p className="text-white">{net.chainId}</p>
          </div>
          <div>
            <span className="text-gray-500">RPC</span>
            <p className="text-white text-xs font-mono">{net.rpcUrl}</p>
          </div>
          <div>
            <span className="text-gray-500">Explorer</span>
            <p>
              <a href={net.explorerUrl} target="_blank" rel="noopener noreferrer"
                 className="text-blue-400 hover:underline text-xs">{net.explorerUrl}</a>
            </p>
          </div>
        </div>
      </div>

      {/* Token table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b border-gray-800">
          Supported Tokens ({net.tokens.length})
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs">
              <th className="text-left p-3">Symbol</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Address</th>
              <th className="text-left p-3">Decimals</th>
              <th className="text-left p-3">Method</th>
            </tr>
          </thead>
          <tbody>
            {net.tokens.map((t) => (
              <tr key={t.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 font-semibold">{t.symbol}</td>
                <td className="p-3 text-gray-400">{t.name}</td>
                <td className="p-3 font-mono text-xs text-gray-500">
                  {t.address === '0x0000000000000000000000000000000000000000'
                    ? 'Native'
                    : `${t.address.slice(0, 10)}...${t.address.slice(-6)}`}
                </td>
                <td className="p-3">{t.decimals}</td>
                <td className="p-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    t.paymentMethod === 'eip3009' ? 'bg-purple-900 text-purple-300' :
                    t.paymentMethod === 'native' ? 'bg-green-900 text-green-300' :
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {t.paymentMethod}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Health JSON */}
      {health && (
        <details className="mt-6">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-300">
            Raw health response
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-400 overflow-x-auto">
            {JSON.stringify(health, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function StatusCard({ title, ok, url }: { title: string; ok: boolean | null; url: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{title}</span>
        <span className={`w-2 h-2 rounded-full ${
          ok === true ? 'bg-green-400' : ok === false ? 'bg-red-400' : 'bg-yellow-400'
        }`} />
      </div>
      <div className="text-xs text-gray-500">{url}</div>
      <div className="text-xs mt-1">
        {ok === true ? <span className="text-green-400">Online</span> :
         ok === false ? <span className="text-red-400">Offline</span> :
         <span className="text-yellow-400">Unknown</span>}
      </div>
    </div>
  );
}
