import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFriendlyMessage } from '@/utils/errorUtils';
import { NFT_ADDRESS } from '@/lib/web3/providers/EVMProvider';

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
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export interface NFTDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  tokenURI?: string;
  owner?: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export default function NFTDetailDialog({
  open,
  onOpenChange,
  tokenId,
  tokenURI: initialUri,
  owner: initialOwner,
}: NFTDetailDialogProps) {
  const { address, isConnected } = useAccount();
  const [meta, setMeta] = useState<NFTMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [transferTo, setTransferTo] = useState('');

  const { data: resolvedUri } = useReadContract({
    address: NFT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    query: { enabled: open && !!NFT_ADDRESS && !!tokenId },
  });
  const uri = initialUri || (resolvedUri as string | undefined);

  const { data: resolvedOwner } = useReadContract({
    address: NFT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
    query: { enabled: open && !!NFT_ADDRESS && !!tokenId },
  });
  const owner = initialOwner || (resolvedOwner as string | undefined);

  const {
    data: transferHash,
    writeContract: writeTransfer,
    isPending: transferPending,
    error: transferError,
  } = useWriteContract();
  const { isLoading: transferConfirming, isSuccess: transferSuccess } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  useEffect(() => {
    if (!open || !uri) return;
    let cancelled = false;
    const load = async () => {
      setMetaLoading(true);
      setMeta(null);
      try {
        let url = uri;
        if (uri.startsWith('ipfs://')) {
          url = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }
        const res = await fetch(url);
        if (!cancelled && res.ok) {
          const json = await res.json();
          setMeta(json);
        }
      } catch {
        if (!cancelled) setMeta(null);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, uri]);

  useEffect(() => {
    if (transferSuccess) {
      toast.success('NFT transferred successfully');
      setTransferTo('');
      onOpenChange(false);
    }
  }, [transferSuccess, onOpenChange]);

  useEffect(() => {
    if (transferError) {
      toast.error(getUserFriendlyMessage(transferError, 'Transfer failed'));
    }
  }, [transferError]);

  const handleTransfer = () => {
    if (!address || !owner || !transferTo.trim() || !NFT_ADDRESS) return;
    const to = transferTo.trim() as `0x${string}`;
    if (!to.startsWith('0x') || to.length !== 42) {
      toast.error('Enter a valid 0x address');
      return;
    }
    if (owner.toLowerCase() !== address.toLowerCase()) {
      toast.error('You can only transfer NFTs you own');
      return;
    }
    writeTransfer({
      address: NFT_ADDRESS as `0x${string}`,
      abi: NFT_ABI,
      functionName: 'transferFrom',
      args: [owner as `0x${string}`, to, BigInt(tokenId)],
    } as unknown as Parameters<typeof writeTransfer>[0]);
  };

  const imageUrl = meta?.image?.startsWith('ipfs://')
    ? meta.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : meta?.image;

  const isOwner = isConnected && address && owner && address.toLowerCase() === owner.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{meta?.name || `NFT #${tokenId}`}</DialogTitle>
          <DialogDescription>
            Token ID: {tokenId}
            {owner && (
              <span className="block mt-1 font-mono text-xs truncate" title={owner}>
                Owner: {owner.slice(0, 6)}…{owner.slice(-4)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {metaLoading ? (
            <div className="aspect-square bg-muted rounded-lg animate-pulse" />
          ) : (
            <>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={meta?.name || `NFT #${tokenId}`}
                  className="w-full aspect-square object-cover rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/400x400?text=NFT+Image';
                  }}
                />
              )}
              {meta?.description && (
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              )}
              {meta?.attributes && meta.attributes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {meta.attributes.map((attr, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-muted rounded text-xs"
                    >
                      <span className="font-medium">{attr.trait_type}:</span>{' '}
                      {String(attr.value)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {uri && (
            <a
              href={uri.startsWith('ipfs://') ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/') : uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View metadata
            </a>
          )}

          {isOwner && (
            <div className="pt-4 border-t space-y-2">
              <Label htmlFor="transfer-to">Transfer to address</Label>
              <div className="flex gap-2">
                <Input
                  id="transfer-to"
                  placeholder="0x..."
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  disabled={transferPending || transferConfirming}
                />
                <Button
                  onClick={handleTransfer}
                  disabled={!transferTo.trim() || transferPending || transferConfirming}
                  size="icon"
                  title="Transfer NFT"
                >
                  {(transferPending || transferConfirming) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {!transferPending && !transferConfirming && <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
