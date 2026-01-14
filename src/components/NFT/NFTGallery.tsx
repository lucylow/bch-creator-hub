import { useEffect, useState } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { NFT_ADDRESS } from '@/lib/web3/providers/EVMProvider';

// NFT Collection ABI
const NFT_ABI = [
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'tokenURI', type: 'string', indexed: false },
    ],
  },
] as const;

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

interface NFT {
  tokenId: string;
  tokenURI: string;
  metadata?: NFTMetadata;
  owner?: string;
}

export default function NFTGallery() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's NFT balance
  const { data: balance } = useReadContract({
    address: NFT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!NFT_ADDRESS,
    },
  });

  useEffect(() => {
    if (!isConnected || !address || !NFT_ADDRESS || !balance) {
      setLoading(false);
      return;
    }

    const fetchNFTs = async () => {
      try {
        setLoading(true);
        setError(null);

        // For demo purposes, we'll fetch a few token IDs
        // In production, you'd use an indexer or events
        const tokenIds: string[] = [];
        const balanceNum = Number(balance);

        // Try to fetch token URIs for tokens 1-10 (or up to balance)
        for (let i = 1; i <= Math.min(balanceNum, 10); i++) {
          tokenIds.push(i.toString());
        }

        const nftPromises = tokenIds.map(async (tokenId) => {
          try {
            // In a real app, you'd use a provider to call tokenURI
            // For now, we'll just show the token ID
            return {
              tokenId,
              tokenURI: `ipfs://token-${tokenId}`,
            };
          } catch (err) {
            console.error(`Error fetching token ${tokenId}:`, err);
            return null;
          }
        });

        const results = await Promise.all(nftPromises);
        setNfts(results.filter((nft): nft is NFT => nft !== null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address, balance, isConnected]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please connect your wallet to view your NFTs
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Gallery</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>NFT Gallery</CardTitle>
        <CardDescription>
          Your NFT collection ({balance?.toString() || 0} NFTs)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <Alert>
            <AlertDescription>
              You don't own any NFTs yet. Mint or purchase one to get started!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <Card key={nft.tokenId}>
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                    {nft.metadata?.image ? (
                      <img
                        src={nft.metadata.image}
                        alt={nft.metadata.name || `NFT #${nft.tokenId}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold">
                    {nft.metadata?.name || `NFT #${nft.tokenId}`}
                  </h3>
                  {nft.metadata?.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {nft.metadata.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Token ID: {nft.tokenId}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


