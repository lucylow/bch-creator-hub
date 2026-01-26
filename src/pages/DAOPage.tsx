import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Vote, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumbs from "@/components/Common/Breadcrumbs";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import EmptyState from "@/components/Common/EmptyState";
import { ProposalCard } from "@/components/DAO";
import daoService from "@/services/daoService";
import type { Proposal, ProposalStatus } from "@/services/daoService";

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "passed", label: "Passed" },
  { value: "executed", label: "Executed" },
  { value: "rejected", label: "Rejected" },
];

const DAOPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  const { data: proposals = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["dao", "proposals"],
    queryFn: () => daoService.getProposals(),
  });

  const filtered = filter === "all"
    ? proposals
    : proposals.filter((p: Proposal) => p.status === (filter as ProposalStatus));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumbs />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Vote className="w-8 h-8 text-primary" />
                DAO Governance
              </h1>
              <p className="text-muted-foreground mt-1">
                View and vote on proposals. Create proposals to allocate treasury or change parameters.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="gap-2"
              >
                {isRefetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link to="/dao/propose">
                  <Plus className="w-4 h-4" />
                  New proposal
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive font-medium">Failed to load proposals.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <Tabs value={filter} onValueChange={setFilter} className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={filter} className="mt-0">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Vote}
                  title="No proposals"
                  description={
                    filter === "all"
                      ? "No governance proposals yet. Create the first one."
                      : `No ${filter} proposals.`
                  }
                  action={
                    filter === "all"
                      ? {
                          label: "Create proposal",
                          onClick: () => navigate("/dao/propose"),
                          variant: "default",
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p: Proposal) => (
                    <ProposalCard key={p.id} proposal={p} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default DAOPage;
