import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Common/Breadcrumbs";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import { ProposalDetail } from "@/components/DAO";
import { useWallet } from "@/contexts/WalletContext";
import daoService from "@/services/daoService";

const DAOProposalPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useWallet();

  const proposalQuery = useQuery({
    queryKey: ["dao", "proposal", id],
    queryFn: () => daoService.getProposal(id!),
    enabled: !!id,
  });

  const votesQuery = useQuery({
    queryKey: ["dao", "proposal", id, "votes"],
    queryFn: () => daoService.getVotesForProposal(id!),
    enabled: !!id,
  });

  const hasVotedQuery = useQuery({
    queryKey: ["dao", "proposal", id, "hasVoted", address],
    queryFn: () => daoService.hasVoted(id!, address!),
    enabled: !!id && !!address,
  });

  const proposal = proposalQuery.data ?? null;
  const votes = votesQuery.data ?? [];
  const hasVoted = !!hasVotedQuery.data;

  const refetchAll = () => {
    proposalQuery.refetch();
    votesQuery.refetch();
    hasVotedQuery.refetch();
  };

  if (!id) {
    navigate("/dao");
    return null;
  }

  if (proposalQuery.isLoading || !proposalQuery.isFetched) {
    return <LoadingSpinner />;
  }

  if (!proposal) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Proposal not found.</p>
          <Button asChild variant="outline">
            <Link to="/dao">Back to governance</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs />
        <div className="mt-4 mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
            <Link to="/dao">
              <ArrowLeft className="w-4 h-4" />
              Back to proposals
            </Link>
          </Button>
        </div>
        <ProposalDetail
          proposal={proposal}
          votes={votes}
          hasVoted={hasVoted}
          onVoted={refetchAll}
        />
      </div>
    </div>
  );
};

export default DAOProposalPage;
