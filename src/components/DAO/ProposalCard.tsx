import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Coins, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBCH, truncateAddress, formatDate } from "@/utils/formatters";
import type { Proposal } from "@/services/daoService";

const statusVariant: Record<Proposal["status"], "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  passed: "secondary",
  executed: "secondary",
  rejected: "destructive",
};

interface ProposalCardProps {
  proposal: Proposal;
}

const ProposalCard = ({ proposal }: ProposalCardProps) => {
  const total = proposal.votesFor + proposal.votesAgainst || 1;
  const forPct = Math.round((proposal.votesFor / total) * 100);

  return (
    <Card className="overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground line-clamp-2">{proposal.title}</h3>
          <Badge variant={statusVariant[proposal.status]} className="shrink-0 capitalize">
            {proposal.status}
          </Badge>
        </div>
        {proposal.amount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Coins className="w-4 h-4" />
            <span>{formatBCH(proposal.amount)}</span>
            <span>→ {truncateAddress(proposal.recipient, 6)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="py-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-emerald-600">
              <ThumbsUp className="w-3.5 h-3.5" /> {proposal.votesFor} for
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <ThumbsDown className="w-3.5 h-3.5" /> {proposal.votesAgainst} against
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full rounded-l-full bg-emerald-500 transition-all"
              style={{ width: `${forPct}%` }}
            />
            <div
              className="h-full rounded-r-full bg-rose-500 transition-all"
              style={{ width: `${100 - forPct}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>Ends {formatDate(proposal.expiresAt)}</span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/dao/proposal/${proposal.id}`} className="gap-1">
            View <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProposalCard;
