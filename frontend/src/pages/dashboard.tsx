import React from "react";
import { Link } from "wouter";
import { 
  useGetMyAccount, 
  useGetDashboardStats, 
  useGetRecentActivity, 
  useGetMiniStatement,
  useGetAccountSummary
} from "@/lib/api";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRightLeft, 
  SendHorizontal, 
  Users, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListOrdered } from "lucide-react";

export default function Dashboard() {
  const { data: account, isLoading: isAccountLoading } = useGetMyAccount({
    query: { queryKey: ["/api/account/me"] }
  });
  
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: {
      queryKey: ["/api/dashboard/stats"],
      retry: false
    }
  });

  const { data: miniStatement, isLoading: isStatementLoading } = useGetMiniStatement({
    query: {
      queryKey: ["/api/account/mini-statement"],
      retry: false
    }
  });

  const { data: activity, isLoading: isActivityLoading } = useGetRecentActivity({
    query: {
      queryKey: ["/api/dashboard/activity"],
      retry: false
    }
  });

  const { data: summary } = useGetAccountSummary({
    query: {
      queryKey: ["/api/account/summary"],
      retry: false
    }
  });

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your accounts and recent activity.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/transfer">
              <SendHorizontal className="mr-2 h-4 w-4" />
              Transfer Funds
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground shadow-lg md:col-span-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Wallet className="w-64 h-64" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/80 font-medium">Main Account</CardDescription>
            <CardTitle className="text-4xl font-bold tracking-tight">
              {isAccountLoading ? (
                <Skeleton className="h-10 w-48 bg-primary-foreground/20" />
              ) : (
                formatCurrency(account?.balance)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAccountLoading ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
                <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-4 text-sm text-primary-foreground/90 font-mono">
                <p>AC: {account?.accountNumber?.replace(/(\d{4})/g, '$1 ').trim()}</p>
                <p>Status: <span className="text-green-300 font-semibold">{account?.status}</span></p>
                <p>Type: {account?.accountType}</p>
                {summary && (
                  <p className="mt-2 text-xs opacity-80">Net Balance this month: {formatCurrency(summary.netBalance)}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-rows-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isStatsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats?.monthlyCredits)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Debits</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isStatsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats?.monthlyDebits)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your last 5 transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isStatementLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : miniStatement?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mb-2 opacity-20" />
                <p>No recent transactions found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {miniStatement?.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tx.type === 'CREDIT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                        tx.type === 'DEBIT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                      }`}>
                        {tx.type === 'CREDIT' ? <TrendingUp className="h-5 w-5" /> : 
                         tx.type === 'DEBIT' ? <TrendingDown className="h-5 w-5" /> : 
                         <ArrowRightLeft className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm leading-none">{tx.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${
                        tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-500' : ''
                      }`}>
                        {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <Badge variant={
                        tx.status === 'SUCCESS' ? 'default' : 
                        tx.status === 'FAILED' ? 'destructive' : 'secondary'
                      } className="mt-1 text-[10px] px-1.5 py-0">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex-col gap-2 hover:border-primary hover:text-primary transition-colors" asChild>
                <Link href="/transfer">
                  <SendHorizontal className="h-6 w-6" />
                  Transfer Funds
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2 hover:border-primary hover:text-primary transition-colors" asChild>
                <Link href="/transactions">
                  <ListOrdered className="h-6 w-6" />
                  Transactions
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2 hover:border-primary hover:text-primary transition-colors" asChild>
                <Link href="/beneficiaries">
                  <Users className="h-6 w-6" />
                  Beneficiaries
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2 hover:border-primary hover:text-primary transition-colors" asChild>
                <Link href="/profile">
                  <Activity className="h-6 w-6" />
                  Activity Log
                </Link>
              </Button>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Account Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Active Beneficiaries</span>
                  <span className="font-medium">{stats?.activeBeneficiaries || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Pending Transactions</span>
                  <span className="font-medium">{stats?.pendingTransactions || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Daily Limit</span>
                  <span className="font-medium">{formatCurrency(stats?.dailyLimit || 10000)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
