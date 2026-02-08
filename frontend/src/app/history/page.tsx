'use client';

import { useState, useEffect } from 'react';
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
      .then(() => {
        setPayments([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [network]);

  return (
    <>
      <div className="hero">
        <div className="hero-badge">Payment History</div>
        <h1>Transaction Log</h1>
        <p>All x402 payments settled on Conflux eSpace</p>
      </div>

      <div className="container-main">
        {/* Network Tabs */}
        <div className="network-tabs">
          {[
            { id: 'testnet', label: 'Testnet', chainId: 71 },
            { id: 'mainnet', label: 'Mainnet', chainId: 1030 },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`network-tab ${network === tab.id ? 'active' : ''}`}
              onClick={() => setNetwork(tab.id)}
            >
              {tab.label}
              <span className="chain-id">({tab.chainId})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['TX Hash', 'Payer', 'Token', 'Amount', 'Method', 'Time'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    color: 'var(--fg-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
                    <span className="spinner" style={{ width: 20, height: 20 }} />
                  </td>
                </tr>
              )}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--fg-muted)',
                    fontSize: 14,
                  }}>
                    No payments yet. Try the demo on the{' '}
                    <a href="/x402-app" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      home page
                    </a>.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(56,161,216,0.08)' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    <a
                      href={`${net.explorerUrl}/tx/${p.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      {p.tx_hash.slice(0, 10)}...
                    </a>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-muted)' }}>
                    {p.payer.slice(0, 8)}...{p.payer.slice(-4)}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.token_symbol}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--warning)', fontWeight: 600 }}>{p.amount_human}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`token-method method-${p.payment_method}`} style={{ position: 'static' }}>
                      {p.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--fg-muted)', fontSize: 11 }}>
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="x402-footer">
          <a href="/x402-app">Back to Demo</a>
        </div>
      </div>
    </>
  );
}
