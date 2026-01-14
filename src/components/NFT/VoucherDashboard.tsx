import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface VoucherStats {
  redeemed: number;
  unredeemed: number;
  total: number;
}

export default function VoucherDashboard() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<VoucherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // In production, this would call your backend API
        // For now, we'll use mock data or on-chain queries
        
        // TODO: Replace with actual API call
        // const response = await fetch('/api/vouchers');
        // const data = await response.json();
        
        // Mock data for demo
        const mockStats: VoucherStats = {
          redeemed: 42,
          unredeemed: 158,
          total: 200,
        };
        
        setStats(mockStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchStats();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your wallet to view voucher statistics
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const redemptionRate = stats
    ? ((stats.redeemed / stats.total) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Voucher Analytics</h2>
        <p className="text-muted-foreground">
          Track redeemed vs unredeemed vouchers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-green-600">
              Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.redeemed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {redemptionRate}% redemption rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-orange-600">
              Unredeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.unredeemed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for redemption
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Redemption Progress</CardTitle>
          <CardDescription>
            Visual representation of voucher redemption status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all"
              style={{
                width: `${redemptionRate}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{stats?.redeemed || 0} redeemed</span>
            <span>{stats?.unredeemed || 0} remaining</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
          <TabsTrigger value="unredeemed">Unredeemed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Voucher System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">CREATE2 Deterministic Deployment</h3>
                <p className="text-sm text-muted-foreground">
                  Vouchers are cryptographically bound to the marketplace contract address,
                  ensuring signatures remain valid across deployments.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Replay Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Each voucher includes nonce and expiry protection to prevent
                  double-redemption and stale voucher usage.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Gasless Meta-Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Support for EIP-712 typed vouchers enables gasless redemption
                  via relayers, improving user experience.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeemed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Redeemed Vouchers</CardTitle>
              <CardDescription>
                {stats?.redeemed || 0} vouchers have been successfully redeemed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed list of redeemed vouchers would appear here.
                In production, this would query on-chain events or your backend database.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unredeemed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Unredeemed Vouchers</CardTitle>
              <CardDescription>
                {stats?.unredeemed || 0} vouchers are still available for redemption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed list of unredeemed vouchers would appear here.
                Users can redeem these vouchers to mint their NFTs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


