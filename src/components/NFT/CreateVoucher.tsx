import { useState } from 'react';
import { useAccount, useChainId, useSignTypedData, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFriendlyMessage } from '@/utils/errorUtils';
import { MARKETPLACE_ADDRESS } from '@/lib/web3/providers/EVMProvider';

const MARKETPLACE_ABI = [
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

const types = {
  NFTVoucher: [
    { name: 'price', type: 'uint256' },
    { name: 'seller', type: 'address' },
    { name: 'uri', type: 'string' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export default function CreateVoucher() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [tokenURI, setTokenURI] = useState('');
  const [priceEth, setPriceEth] = useState('');
  const [signedPayload, setSignedPayload] = useState<string | null>(null);

  const { data: currentNonce } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: MARKETPLACE_ABI,
    functionName: 'nonces',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!MARKETPLACE_ADDRESS },
  });

  const { signTypedDataAsync, isPending, error, reset } = useSignTypedData();

  const handleSign = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!MARKETPLACE_ADDRESS) {
      toast.error('Marketplace contract address not configured');
      return;
    }
    if (!tokenURI.trim()) {
      toast.error('Enter a token URI');
      return;
    }
    const priceWei = priceEth.trim() === '' ? 0n : parseEther(priceEth.trim());
    const nonce = currentNonce ?? 0n;

    const domain = {
      name: 'LazyNFTMarketplace',
      version: '1',
      chainId,
      verifyingContract: MARKETPLACE_ADDRESS as `0x${string}`,
    };
    const message = {
      price: priceWei,
      seller: address as `0x${string}`,
      uri: tokenURI.trim(),
      nonce,
    };

    try {
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'NFTVoucher',
        message,
      } as unknown as Parameters<typeof signTypedDataAsync>[0]);
      const payload = JSON.stringify(
        {
          seller: address,
          uri: tokenURI.trim(),
          price: priceEth.trim() || '0',
          nonce: nonce.toString(),
          signature,
        },
        null,
        2
      );
      setSignedPayload(payload);
      toast.success('Voucher signed');
    } catch (err) {
      toast.error(getUserFriendlyMessage(err, 'Failed to sign voucher'));
    }
  };

  const handleCopy = async () => {
    if (!signedPayload) return;
    try {
      await navigator.clipboard.writeText(signedPayload);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleNew = () => {
    setSignedPayload(null);
    reset();
  };

  if (signedPayload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Voucher ready
          </CardTitle>
          <CardDescription>
            Share this JSON with the buyer. They can paste it in the Buy tab to redeem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            readOnly
            value={signedPayload}
            rows={12}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy JSON
            </Button>
            <Button onClick={handleNew} variant="secondary">
              Create another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create voucher</CardTitle>
        <CardDescription>
          Sign a lazy-mint voucher. Buyers can redeem it in the Buy tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert>
            <AlertDescription>Connect your wallet to create vouchers</AlertDescription>
          </Alert>
        )}

        {currentNonce !== undefined && (
          <p className="text-sm text-muted-foreground">Next nonce: {currentNonce.toString()}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="create-uri">Token URI (IPFS metadata)</Label>
          <Input
            id="create-uri"
            placeholder="ipfs://bafybeiexample/metadata.json"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-price">Price (ETH)</Label>
          <Input
            id="create-price"
            type="text"
            inputMode="decimal"
            placeholder="0.1"
            value={priceEth}
            onChange={(e) => setPriceEth(e.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">Use 0 or leave empty for free.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSign}
          disabled={!isConnected || !tokenURI.trim() || isPending}
          className="w-full gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign voucher
        </Button>
      </CardContent>
    </Card>
  );
}
