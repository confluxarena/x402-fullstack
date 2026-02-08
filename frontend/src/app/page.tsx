'use client';

import { useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { NETWORKS, type Token } from '@/lib/networks';
import { payAndFetch, formatAmount } from '@/lib/x402-client';
import { connectWallet, getAddress, shortAddress } from '@/lib/wallet';
import NetworkTabs from '@/components/NetworkTabs';
import TokenSelector from '@/components/TokenSelector';
import WalletButton from '@/components/WalletButton';
import StatusLog from '@/components/StatusLog';
import ResultCard from '@/components/ResultCard';

const SELLER_URL = process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3850';

type Mode = 'server' | 'wallet';

export default function Home() {
  const [network, setNetwork] = useState('testnet');
  const [token, setToken] = useState('CFX');
  const [mode, setMode] = useState<Mode>('server');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Wallet state
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  const net = NETWORKS[network];
  const tokens = net.tokens;

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleNetworkChange = (n: string) => {
    setNetwork(n);
    setToken('CFX'); // Reset token on network change
    setResult(null);
    setError('');
    setLogs([]);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const provider = await connectWallet(net);
      providerRef.current = provider;
      const addr = await getAddress(provider);
      setAddress(addr);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    providerRef.current = null;
  };

  // Server Demo: proxy call through seller API (no wallet needed)
  const handleServerDemo = async () => {
    setLoading(true);
    setLogs([]);
    setResult(null);
    setError('');

    const q = question || 'What is Conflux Network?';

    try {
      addLog(`GET ${SELLER_URL}/ai?q=${encodeURIComponent(q)}&token=${token}&demo=1`);
      const res = await fetch(
        `${SELLER_URL}/ai?q=${encodeURIComponent(q)}&token=${token}&demo=1`,
      );
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          addLog('Received HTTP 402 — Payment Required');
          const paymentHeader = res.headers.get('PAYMENT-REQUIRED') || res.headers.get('payment-required');
          if (paymentHeader) {
            const envelope = JSON.parse(atob(paymentHeader));
            const req = envelope.accepts[0];
            addLog(`Token: ${req.extra.symbol} (${req.extra.paymentMethod})`);
            addLog(`Amount: ${formatAmount(req.amount, req.extra.decimals)} ${req.extra.symbol}`);
            addLog(`Pay to: ${req.payTo}`);
          }
          setError('Payment required — use "Pay with Wallet" mode to complete the payment');
        } else {
          setError(data.error || data.message || `HTTP ${res.status}`);
        }
        return;
      }

      addLog('HTTP 200 — Success');
      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Wallet mode: full x402 flow
  const handleWalletPay = async () => {
    if (!providerRef.current) {
      setError('Connect your wallet first');
      return;
    }

    setLoading(true);
    setLogs([]);
    setResult(null);
    setError('');

    const q = question || 'What is Conflux Network?';

    try {
      const signer = await providerRef.current.getSigner();
      const url = `${SELLER_URL}/ai?q=${encodeURIComponent(q)}&token=${token}`;

      const payResult = await payAndFetch(url, signer, addLog);

      if (!payResult.success) {
        setError(payResult.error || 'Payment failed');
        return;
      }

      addLog('Payment settled successfully!');
      setResult(payResult.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          x402 Protocol <span className="text-blue-400">Demo</span>
        </h1>
        <p className="text-gray-500 text-sm">
          HTTP 402 Payment Required — Multi-token payments on Conflux eSpace
        </p>
      </div>

      {/* Network Tabs */}
      <NetworkTabs active={network} onChange={handleNetworkChange} />

      {/* Token Selector */}
      <TokenSelector tokens={tokens} selected={token} onChange={setToken} />

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => setMode('server')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            mode === 'server'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Server Demo
        </button>
        <button
          onClick={() => setMode('wallet')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            mode === 'wallet'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pay with Wallet
        </button>
      </div>

      {/* Wallet connect (wallet mode only) */}
      {mode === 'wallet' && (
        <div className="flex justify-end mb-4">
          <WalletButton
            address={address}
            connecting={connecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      )}

      {/* Question input */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Ask something about Conflux..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) {
              mode === 'server' ? handleServerDemo() : handleWalletPay();
            }
          }}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />

        <button
          onClick={mode === 'server' ? handleServerDemo : handleWalletPay}
          disabled={loading || (mode === 'wallet' && !address)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing...' : mode === 'server' ? 'Send (Server Demo)' : `Pay & Ask (${token})`}
        </button>
      </div>

      {/* Token info */}
      <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
        <span>Network: {net.name}</span>
        <span>Token: {token}</span>
        <span>Method: {tokens.find((t) => t.symbol === token)?.paymentMethod}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Status log */}
      <StatusLog messages={logs} />

      {/* Result */}
      {result && <ResultCard data={result} explorerUrl={net.explorerUrl} />}
    </div>
  );
}
