'use client';

import { useState } from 'react';
import { NETWORKS } from '@/lib/networks';
import NetworkTabs from '@/components/NetworkTabs';
import TokenSelector from '@/components/TokenSelector';

const SELLER_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3850';

export default function PayPage() {
  const [network, setNetwork] = useState('testnet');
  const [token, setToken] = useState('CFX');

  const net = NETWORKS[network];
  const tokenObj = net.tokens.find((t) => t.symbol === token);

  const handleNetworkChange = (n: string) => {
    setNetwork(n);
    setToken('CFX');
  };

  // Build curl command for copy
  const curlCmd = `curl -s "${SELLER_URL}/ai?q=What+is+Conflux&token=${token}"`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">API Pricing</h1>
      <p className="text-gray-500 text-sm mb-6">
        Select a network and token to see x402 payment details.
      </p>

      <NetworkTabs active={network} onChange={handleNetworkChange} />
      <TokenSelector
        tokens={net.tokens}
        selected={token}
        onChange={setToken}
      />

      {tokenObj && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Token</span>
              <p className="text-white font-semibold">{tokenObj.symbol}</p>
            </div>
            <div>
              <span className="text-gray-500">Payment Method</span>
              <p className="text-white">{tokenObj.paymentMethod}</p>
            </div>
            <div>
              <span className="text-gray-500">Contract</span>
              <p className="text-xs font-mono text-gray-400">
                {tokenObj.address === '0x0000000000000000000000000000000000000000'
                  ? 'Native coin'
                  : tokenObj.address}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Decimals</span>
              <p className="text-white">{tokenObj.decimals}</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <span className="text-gray-500 text-sm">Try it (terminal)</span>
            <pre className="mt-2 p-3 bg-gray-950 rounded text-xs text-green-400 overflow-x-auto">
              {curlCmd}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
