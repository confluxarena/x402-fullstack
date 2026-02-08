/**
 * x402 Facilitator Service
 *
 * Handles payment verification and settlement for three methods:
 *   - EIP-3009: Gasless transferWithAuthorization (USDT0)
 *   - ERC-20:   approve + transferFrom via payment contract
 *   - Native:   Direct CFX transfer verification
 *
 * @package x402-fullstack
 */

import http from 'http';
import { ethers } from 'ethers';
import { cfg, NETWORKS } from './config.js';
import { verifyEip3009, settleEip3009 } from './handlers/eip3009.js';
import { verifyErc20, settleErc20 } from './handlers/erc20.js';
import { verifyNative, settleNative } from './handlers/native.js';

// ── Blockchain connection ──

const networkCfg = NETWORKS[cfg.network];
if (!networkCfg) {
  console.error(`[facilitator] Unknown network: ${cfg.network}`);
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(networkCfg.rpc);
const wallet = new ethers.Wallet(cfg.relayerKey, provider);

// ── Helpers ──

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_048_576) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function checkAuth(req: http.IncomingMessage): boolean {
  const key = req.headers['x-api-key'];
  return key === cfg.apiKey;
}

// ── Request handler ──

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', `http://localhost:${cfg.port}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Health check
  if (path === '/x402/health' && req.method === 'GET') {
    const balance = await provider.getBalance(wallet.address);
    return sendJson(res, 200, {
      status: 'ok',
      network: cfg.network,
      chainId: networkCfg.chainId,
      facilitator: wallet.address,
      balanceCFX: ethers.formatEther(balance),
      paymentContract: cfg.network === 'testnet' ? cfg.paymentContract.testnet : cfg.paymentContract.mainnet,
    });
  }

  // All other endpoints require auth
  if (!checkAuth(req)) return sendJson(res, 401, { error: 'Invalid API key' });

  let body: any;
  try { body = await parseBody(req); }
  catch { return sendJson(res, 400, { error: 'Invalid request body' }); }

  // ── EIP-3009 ──
  if (path === '/x402/verify-eip3009' && req.method === 'POST') {
    const result = await verifyEip3009(body, provider);
    return sendJson(res, 200, result);
  }
  if (path === '/x402/settle-eip3009' && req.method === 'POST') {
    const result = await settleEip3009(body, wallet);
    return sendJson(res, result.success ? 200 : 500, result);
  }

  // ── ERC-20 ──
  if (path === '/x402/verify-erc20' && req.method === 'POST') {
    const result = await verifyErc20(body, provider);
    return sendJson(res, 200, result);
  }
  if (path === '/x402/settle-erc20' && req.method === 'POST') {
    const result = await settleErc20(body, wallet);
    return sendJson(res, result.success ? 200 : 500, result);
  }

  // ── Native CFX ──
  if (path === '/x402/verify-native' && req.method === 'POST') {
    const result = await verifyNative(body, provider);
    return sendJson(res, 200, result);
  }
  if (path === '/x402/settle-native' && req.method === 'POST') {
    const result = await settleNative(body, wallet);
    return sendJson(res, result.success ? 200 : 500, result);
  }

  sendJson(res, 404, { error: 'Not found' });
}

// ── Server ──

const server = http.createServer(handleRequest);

async function start() {
  console.log('[facilitator] x402 Facilitator v1.0.0');
  console.log(`[facilitator] Network: ${cfg.network} (chain ${networkCfg.chainId})`);
  console.log(`[facilitator] Relayer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`[facilitator] Balance: ${ethers.formatEther(balance)} CFX`);

  const contract = cfg.network === 'testnet' ? cfg.paymentContract.testnet : cfg.paymentContract.mainnet;
  console.log(`[facilitator] Payment contract: ${contract || 'NOT SET'}`);

  server.listen(cfg.port, '127.0.0.1', () => {
    console.log(`[facilitator] Listening on http://127.0.0.1:${cfg.port}`);
    console.log('[facilitator] Endpoints:');
    console.log('  GET  /x402/health');
    console.log('  POST /x402/verify-eip3009   POST /x402/settle-eip3009');
    console.log('  POST /x402/verify-erc20     POST /x402/settle-erc20');
    console.log('  POST /x402/verify-native    POST /x402/settle-native');
  });
}

process.on('SIGINT', () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

start().catch((err) => { console.error('[facilitator] Fatal:', err); process.exit(1); });
