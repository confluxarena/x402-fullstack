/**
 * Wallet connection helper — MetaMask / injected providers
 */

import { ethers } from 'ethers';
import type { Network } from './networks';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(network: Network): Promise<ethers.BrowserProvider> {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another EVM wallet.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);

  // Ensure correct chain
  const chainIdHex = `0x${network.chainId.toString(16)}`;
  try {
    await provider.send('wallet_switchEthereumChain', [{ chainId: chainIdHex }]);
  } catch (err: any) {
    if (err.code === 4902) {
      await provider.send('wallet_addEthereumChain', [{
        chainId: chainIdHex,
        chainName: network.name,
        nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl],
      }]);
    } else {
      throw err;
    }
  }

  return provider;
}

export async function getAddress(provider: ethers.BrowserProvider): Promise<string> {
  const signer = await provider.getSigner();
  return signer.getAddress();
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
