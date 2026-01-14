import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { CreatorProvider } from "@/contexts/CreatorContext";
import { EVMProvider } from "@/lib/web3/providers/EVMProvider";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import PaymentLinksPage from "./pages/PaymentLinksPage";
import CreateLinkPage from "./pages/CreateLinkPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentPage from "./pages/PaymentPage";
import NFTsPage from "./pages/NFTsPage";
import AppNavigation from "./components/Navigation/AppNavigation";
import NotFound from "./pages/NotFound";

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
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppNavigation />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/links" element={<PaymentLinksPage />} />
                  <Route path="/links/new" element={<CreateLinkPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/nfts" element={<NFTsPage />} />
                  <Route path="/pay/:creatorId" element={<PaymentPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CreatorProvider>
          </WalletProvider>
        </EVMProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
