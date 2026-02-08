'use client';

import { useState, useEffect } from 'react';
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
    fetch(`${SELLER_URL}/health`)
      .then((r) => r.json())
      .then((data) => {
        setHealth(data);
        setSellerOk(true);
      })
      .catch(() => setSellerOk(false));

    setFacilitatorOk(null);
  }, [network]);

  return (
    <>
      <div className="hero">
        <div className="hero-badge">Admin Panel</div>
        <h1>System Dashboard</h1>
        <p>Service health, network configuration, and supported tokens</p>
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

        {/* Service Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatusCard title="Seller API" ok={sellerOk} url={SELLER_URL} />
          <StatusCard title="Facilitator" ok={facilitatorOk} url="Internal :3851" />
          <StatusCard title="Database" ok={sellerOk} url="PostgreSQL 16" />
        </div>

        {/* Network Info */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Network Configuration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <InfoRow label="Network" value={net.name} />
            <InfoRow label="Chain ID" value={String(net.chainId)} />
            <InfoRow label="RPC" value={net.rpcUrl} mono />
            <InfoRow
              label="Explorer"
              value={net.explorerUrl}
              mono
              link={net.explorerUrl}
            />
          </div>
        </div>

        {/* Token Table */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 15,
            fontWeight: 700,
          }}>
            Supported Tokens ({net.tokens.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Symbol', 'Name', 'Address', 'Decimals', 'Method'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '10px 14px',
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
              {net.tokens.map((t) => (
                <tr key={t.symbol} style={{ borderBottom: '1px solid rgba(56,161,216,0.08)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{t.symbol}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--fg-muted)' }}>{t.name}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-muted)' }}>
                    {t.address === '0x0000000000000000000000000000000000000000'
                      ? 'Native'
                      : `${t.address.slice(0, 10)}...${t.address.slice(-6)}`}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{t.decimals}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`token-method method-${t.paymentMethod}`} style={{ position: 'static' }}>
                      {t.paymentMethod === 'eip3009' ? '3009' : t.paymentMethod === 'erc20' ? 'ERC20' : 'CFX'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Raw Health */}
        {health && (
          <details style={{ marginTop: 20 }}>
            <summary style={{ color: 'var(--fg-muted)', fontSize: 12, cursor: 'pointer' }}>
              Raw health response
            </summary>
            <pre style={{
              marginTop: 8,
              padding: 16,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 11,
              fontFamily: 'var(--mono)',
              color: 'var(--fg-muted)',
              overflowX: 'auto',
            }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </details>
        )}

        <div className="x402-footer">
          <a href="/x402-app">Back to Demo</a>
        </div>
      </div>
    </>
  );
}

function StatusCard({ title, ok, url }: { title: string; ok: boolean | null; url: string }) {
  const dotColor = ok === true ? 'var(--success)' : ok === false ? 'var(--danger)' : 'var(--warning)';
  const statusText = ok === true ? 'Online' : ok === false ? 'Offline' : 'Unknown';
  const statusColor = dotColor;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--mono)' }}>{url}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: statusColor, fontWeight: 600 }}>{statusText}</div>
    </div>
  );
}

function InfoRow({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2 }}>{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{
          fontSize: 12,
          fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
          color: 'var(--primary)',
          textDecoration: 'none',
        }}>
          {value}
        </a>
      ) : (
        <div style={{
          fontSize: 13,
          fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
          color: 'var(--fg)',
          wordBreak: 'break-all',
        }}>
          {value}
        </div>
      )}
    </div>
  );
}
