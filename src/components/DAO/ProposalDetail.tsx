import { Coins, Calendar, Users, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBCH, truncateAddress, formatDate } from "@/utils/formatters";
import VoteControls from "./VoteControls";
import type { Proposal, Vote } from "@/services/daoService";

const statusVariant: Record<Proposal["status"], "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  passed: "secondary",
  executed: "secondary",
  rejected: "destructive",
};

interface ProposalDetailProps {
  proposal: Proposal;
  votes: Vote[];
  hasVoted: boolean;
  onVoted?: () => void;
}

const ProposalDetail = ({ proposal, votes, hasVoted, onVoted }: ProposalDetailProps) => {
  const total = proposal.votesFor + proposal.votesAgainst || 1;
  const forPct = Math.round((proposal.votesFor / total) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{proposal.title}</h1>
            <Badge variant={statusVariant[proposal.status]} className="shrink-0 capitalize text-sm">
              {proposal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">{proposal.description}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {proposal.amount > 0 && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                <Coins className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="font-semibold">{formatBCH(proposal.amount)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <Users className="w-5 h-5 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient</p>
                <p className="font-mono text-sm truncate" title={proposal.recipient}>
                  {truncateAddress(proposal.recipient, 10)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voting ends</p>
                <p className="font-medium">{formatDate(proposal.expiresAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quorum</p>
                <p className="font-medium">{proposal.quorum} votes required</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Vote tally</p>
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full rounded-l-full bg-emerald-500 transition-all"
                style={{ width: `${forPct}%` }}
              />
              <div
                className="h-full rounded-r-full bg-rose-500 transition-all"
                style={{ width: `${100 - forPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-emerald-600 font-medium">{proposal.votesFor} For</span>
              <span className="text-rose-600 font-medium">{proposal.votesAgainst} Against</span>
            </div>
          </div>

          {proposal.status === "active" && !hasVoted && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Cast your vote</p>
              <VoteControls proposalId={proposal.id} onVoted={onVoted} />
            </div>
          )}

          {proposal.status === "active" && hasVoted && (
            <p className="text-sm text-muted-foreground">You have already voted on this proposal.</p>
          )}
        </CardContent>
      </Card>

      {votes.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Recent votes</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {votes.slice(0, 10).map((v, i) => (
                <li
                  key={`${v.voter}-${v.timestamp}-${i}`}
                  className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
                >
                  <span className="font-mono text-muted-foreground">{truncateAddress(v.voter, 8)}</span>
                  <Badge variant={v.vote === "for" ? "default" : "secondary"} className="capitalize">
                    {v.vote}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalDetail;
