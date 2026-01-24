import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { NFT_ADDRESS } from '@/lib/web3/providers/EVMProvider';

// NFT Collection ABI (minimal - full ABI available after compilation)
const NFT_ABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'tokenURI_', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const;

export default function MintForm() {
  const { address, isConnected } = useAccount();
  const [tokenURI, setTokenURI] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  const {
    data: hash,
    writeContract,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenURI.trim()) {
      toast.error('Please enter a token URI');
      return;
    }

    if (!NFT_ADDRESS) {
      toast.error('NFT contract address not configured');
      return;
    }

    try {
      setIsMinting(true);
      writeContract({
        address: NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [address, tokenURI],
      } as any);
    } catch (err) {
      console.error('Mint error:', err);
      toast.error('Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mint Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Your NFT has been minted successfully.</span>
          </div>
          {hash && (
            <p className="mt-2 text-sm text-muted-foreground">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint NFT</CardTitle>
        <CardDescription>
          Mint a new NFT directly to your wallet (requires MINTER_ROLE)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert>
            <AlertDescription>
              Please connect your wallet to mint NFTs
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="tokenURI">Token URI (IPFS URL)</Label>
          <Input
            id="tokenURI"
            placeholder="ipfs://bafybeiexample/metadata.json"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            disabled={isPending || isConfirming}
          />
          <p className="text-sm text-muted-foreground">
            Enter the IPFS URL of your NFT metadata
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleMint}
          disabled={!isConnected || !tokenURI || isPending || isConfirming}
          className="w-full"
        >
          {(isPending || isConfirming) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isPending ? 'Confirming...' : isConfirming ? 'Minting...' : 'Mint NFT'}
        </Button>
      </CardContent>
    </Card>
  );
}

