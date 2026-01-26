import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import daoService from "@/services/daoService";
import WalletConnectButton from "@/components/Wallet/WalletConnectButton";

interface VoteControlsProps {
  proposalId: string;
  onVoted?: () => void;
}

const VoteControls = ({ proposalId, onVoted }: VoteControlsProps) => {
  const { isConnected, address } = useWallet();
  const [submitting, setSubmitting] = useState<"for" | "against" | null>(null);

  const castVote = async (support: "for" | "against") => {
    if (!address) return;
    setSubmitting(support);
    try {
      const result = await daoService.submitVote(proposalId, support, address);
      if (result.success) {
        toast.success(`Vote ${support} recorded successfully`);
        onVoted?.();
      } else {
        toast.error(result.error || "Vote failed");
      }
    } catch (e) {
      toast.error("Vote failed");
    } finally {
      setSubmitting(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">Connect your wallet to vote on this proposal.</p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="default"
        onClick={() => castVote("for")}
        disabled={!!submitting}
        className="gap-2"
      >
        {submitting === "for" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ThumbsUp className="w-4 h-4" />
        )}
        Vote For
      </Button>
      <Button
        variant="outline"
        onClick={() => castVote("against")}
        disabled={!!submitting}
        className="gap-2"
      >
        {submitting === "against" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ThumbsDown className="w-4 h-4" />
        )}
        Vote Against
      </Button>
    </div>
  );
};

export default VoteControls;
