import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { CreatorProvider } from "@/contexts/CreatorContext";
import { LiveTransactionsProviderFromCreator } from "@/contexts/LiveTransactionsContext";
import { EVMProvider } from "@/lib/web3/providers/EVMProvider";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import AppNavigation from "@/components/Navigation/AppNavigation";
import PageTransition from "@/components/Common/PageTransition";
import Index from "@/pages/Index";
import DashboardPage from "@/pages/DashboardPage";
import PaymentLinksPage from "@/pages/PaymentLinksPage";
import CreateLinkPage from "@/pages/CreateLinkPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import PaymentPage from "@/pages/PaymentPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import NFTsPage from "@/pages/NFTsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import WithdrawalsPage from "@/pages/WithdrawalsPage";
import SupportersPage from "@/pages/SupportersPage";
import HelpPage from "@/pages/HelpPage";
import NotFound from "@/pages/NotFound";
import DAOPage from "@/pages/DAOPage";
import DAOProposalPage from "@/pages/DAOProposalPage";
import DAOProposePage from "@/pages/DAOProposePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EVMProvider>
          <WalletProvider>
            <CreatorProvider>
              <LiveTransactionsProviderFromCreator>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <a
                    href="#main-content"
                    className="absolute -left-[9999px] z-[100] px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                  >
                    Skip to main content
                  </a>
                  <AppNavigation />
                  <PageTransition>
                    <main id="main-content" className="min-h-screen" role="main">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/links" element={<PaymentLinksPage />} />
                        <Route path="/links/new" element={<CreateLinkPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/nfts" element={<NFTsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/withdrawals" element={<WithdrawalsPage />} />
                        <Route path="/supporters" element={<SupportersPage />} />
                        <Route path="/dao" element={<DAOPage />} />
                        <Route path="/dao/proposal/:id" element={<DAOProposalPage />} />
                        <Route path="/dao/propose" element={<DAOProposePage />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/pay/success" element={<PaymentSuccessPage />} />
                        <Route path="/pay/:creatorId/:paymentId?" element={<PaymentPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </PageTransition>
                </BrowserRouter>
              </LiveTransactionsProviderFromCreator>
            </CreatorProvider>
          </WalletProvider>
        </EVMProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
