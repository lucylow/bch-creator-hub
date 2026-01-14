import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, encodeAbiParameters, parseAbiParameters } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { MARKETPLACE_ADDRESS } from '@/lib/web3/providers/EVMProvider';

// Marketplace ABI
const MARKETPLACE_ABI = [
  {
    type: 'function',
    name: 'redeem',
    inputs: [
      {
        name: 'v',
        type: 'tuple',
        components: [
          { name: 'price', type: 'uint256' },
          { name: 'seller', type: 'address' },
          { name: 'uri', type: 'string' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export default function BuyNFT() {
  const { address, isConnected } = useAccount();
  const [seller, setSeller] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [price, setPrice] = useState('');
  const [nonce, setNonce] = useState('0');
  const [signature, setSignature] = useState('');

  const {
    data: hash,
    writeContract,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read current nonce for seller
  const { data: currentNonce } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: MARKETPLACE_ABI,
    functionName: 'nonces',
    args: seller ? [seller as `0x${string}`] : undefined,
    query: {
      enabled: !!seller && seller.startsWith('0x'),
    },
  });

  const handleRedeem = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!seller || !tokenURI || !price || !signature) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!MARKETPLACE_ADDRESS) {
      toast.error('Marketplace contract address not configured');
      return;
    }

    try {
      const voucher = {
        price: parseEther(price),
        seller: seller as `0x${string}`,
        uri: tokenURI,
        nonce: BigInt(nonce || '0'),
      };

      writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'redeem',
        args: [voucher, signature as `0x${string}`],
        value: parseEther(price),
      });
    } catch (err) {
      console.error('Redeem error:', err);
      toast.error('Failed to redeem voucher');
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Your NFT has been purchased and minted.</span>
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
        <CardTitle>Buy NFT (Lazy Mint)</CardTitle>
        <CardDescription>
          Redeem a signed voucher to purchase and mint an NFT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert>
            <AlertDescription>
              Please connect your wallet to purchase NFTs
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="seller">Seller Address</Label>
          <Input
            id="seller"
            placeholder="0x..."
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            disabled={isPending || isConfirming}
          />
          {currentNonce !== undefined && (
            <p className="text-sm text-muted-foreground">
              Current nonce for seller: {currentNonce.toString()}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenURI">Token URI</Label>
          <Input
            id="tokenURI"
            placeholder="ipfs://bafybeiexample/metadata.json"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            disabled={isPending || isConfirming}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (ETH)</Label>
          <Input
            id="price"
            type="number"
            step="0.001"
            placeholder="0.1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isPending || isConfirming}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nonce">Nonce</Label>
          <Input
            id="nonce"
            type="number"
            placeholder="0"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            disabled={isPending || isConfirming}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signature">Signature (0x...)</Label>
          <Textarea
            id="signature"
            placeholder="0x..."
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            disabled={isPending || isConfirming}
            rows={3}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleRedeem}
          disabled={!isConnected || !seller || !tokenURI || !price || !signature || isPending || isConfirming}
          className="w-full"
        >
          {(isPending || isConfirming) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isPending ? 'Confirming...' : isConfirming ? 'Purchasing...' : `Purchase NFT (${price} ETH)`}
        </Button>
      </CardContent>
    </Card>
  );
}

