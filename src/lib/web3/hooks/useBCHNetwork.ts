// Hook for BCH network (mainnet / testnet) and explorer URLs
import { useMemo } from 'react';
import { bchProvider } from '../providers/BCHProvider';
import { getBlockExplorerUrl } from '../utils/bch';

const DEFAULT_NETWORK = import.meta.env.VITE_BCH_NETWORK || 'mainnet';

export function useBCHNetwork() {
  return useMemo(() => {
    const network = typeof bchProvider.getNetwork === 'function'
      ? bchProvider.getNetwork()
      : DEFAULT_NETWORK;

    return {
      network,
      isTestnet: network === 'testnet',
      isMainnet: network === 'mainnet',
      getTxExplorerUrl: (txid: string) => getBlockExplorerUrl(network, 'tx', txid),
      getAddressExplorerUrl: (address: string) =>
        typeof bchProvider.getBlockExplorerAddressUrl === 'function'
          ? bchProvider.getBlockExplorerAddressUrl(address)
          : getBlockExplorerUrl(network, 'address', address),
    };
  }, []);
}
