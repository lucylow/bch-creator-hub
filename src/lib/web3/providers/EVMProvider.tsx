import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

// Get contract addresses from environment or use defaults
const NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS || '';
const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || '';

// Configure chains
const chains = [hardhat, sepolia] as const;

// Configure wagmi
const config = getDefaultConfig({
  appName: 'BCH Creator Hub',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains,
  ssr: false,
});

interface EVMProviderProps {
  children: ReactNode;
}

export function EVMProvider({ children }: EVMProviderProps) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export { NFT_ADDRESS, MARKETPLACE_ADDRESS };

