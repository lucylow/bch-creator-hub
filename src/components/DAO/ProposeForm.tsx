import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import daoService from "@/services/daoService";
import { validateBCHAddress } from "@/utils/formatters";
import WalletConnectButton from "@/components/Wallet/WalletConnectButton";

const ProposeForm = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Enter a valid amount (satoshis).");
      return;
    }
    if (!recipient.trim()) {
      toast.error("Recipient address is required.");
      return;
    }
    if (!validateBCHAddress(recipient.trim())) {
      toast.error("Enter a valid BCH address.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await daoService.createProposal({
        title: title.trim(),
        description: description.trim() || "No description.",
        amount: amountNum,
        recipient: recipient.trim(),
        proposerAddress: address,
      });
      if (result.success) {
        toast.success("Proposal created successfully.");
        navigate("/dao");
      } else {
        toast.error(result.error || "Failed to create proposal.");
      }
    } catch {
      toast.error("Failed to create proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create proposal</CardTitle>
          <CardDescription>Connect your wallet to create a governance proposal.</CardDescription>
        </CardHeader>
        <CardContent>
          <WalletConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New proposal</CardTitle>
        <CardDescription>
          Proposals are voted on by token holders. Amount is in satoshis; use 0 for parameter changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fund Creator Discovery Page"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the proposal and why it should be approved."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (satoshis)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient address</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="bitcoincash:..."
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create proposal"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProposeForm;
