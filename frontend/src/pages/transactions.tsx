import React, { useState } from "react";
import { useListTransactions, useGetTransaction } from "@/lib/api";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, ArrowRightLeft, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ListTransactionsType } from "@/lib/api";

function TransactionDetailDialog({ id, onClose }: { id: string | null, onClose: () => void }) {
  const { data: tx, isLoading } = useGetTransaction(id || "", {
    query: {
      queryKey: ["/api/transactions", id],
      enabled: !!id
    }
  });

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Reference: {tx?.referenceNo || <Skeleton className="h-4 w-24 inline-block ml-2 align-middle" />}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tx ? (
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-3 ${
                tx.type === 'CREDIT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                tx.type === 'DEBIT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
              }`}>
                {tx.type === 'CREDIT' ? <TrendingUp className="h-6 w-6" /> : 
                 tx.type === 'DEBIT' ? <TrendingDown className="h-6 w-6" /> : 
                 <ArrowRightLeft className="h-6 w-6" />}
              </div>
              <h2 className={`text-3xl font-bold ${
                tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-500' : ''
              }`}>
                {tx.type === 'CREDIT' ? '+' : '-'}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(tx.amount)}
              </h2>
              <Badge variant={
                tx.status === 'SUCCESS' ? 'default' : 
                tx.status === 'FAILED' ? 'destructive' : 'secondary'
              } className="mt-2">
                {tx.status}
              </Badge>
            </div>
            
            <div className="space-y-3 mt-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-[200px]">{tx.description}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{tx.type}</span>
              </div>
              {tx.toAccountNumber && tx.type === 'TRANSFER' && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">To Account</span>
                  <span className="font-medium font-mono">{tx.toAccountNumber}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function Transactions() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [type, setType] = useState<ListTransactionsType | "ALL">("ALL");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const { data: transactionPage, isLoading } = useListTransactions(
    { 
      page, 
      size, 
      ...(type !== "ALL" ? { type: type as ListTransactionsType } : {})
    },
    {
      query: {
        queryKey: ["/api/transactions", { page, size, type }],
        keepPreviousData: true
      }
    }
  );

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('btms_token');
      const res = await fetch('/api/transactions/export', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`; 
      a.click();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and filter your complete transaction history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select 
            value={type} 
            onValueChange={(val: any) => { setType(val); setPage(0); }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Transactions</SelectItem>
              <SelectItem value="CREDIT">Credits Only</SelectItem>
              <SelectItem value="DEBIT">Debits Only</SelectItem>
              <SelectItem value="TRANSFER">Transfers Only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[200px]">Date & Ref</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-full max-w-[250px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-[80px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : transactionPage?.content && transactionPage.content.length > 0 ? (
                transactionPage.content.map((tx) => (
                  <TableRow 
                    key={tx.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTxId(tx.id)}
                  >
                    <TableCell>
                      <div className="font-medium text-sm">
                        {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {tx.referenceNo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{tx.description}</div>
                      {tx.toAccountNumber && tx.type === 'TRANSFER' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          To: {tx.toAccountNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {tx.type === 'CREDIT' && <><TrendingUp className="h-3 w-3 text-green-500" /> CREDIT</>}
                        {tx.type === 'DEBIT' && <><TrendingDown className="h-3 w-3 text-red-500" /> DEBIT</>}
                        {tx.type === 'TRANSFER' && <><ArrowRightLeft className="h-3 w-3 text-blue-500" /> TRANSFER</>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        tx.status === 'SUCCESS' ? 'default' : 
                        tx.status === 'FAILED' ? 'destructive' : 'secondary'
                      } className="text-[10px] px-2 py-0.5">
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-500' : 'text-foreground'
                    }`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No transactions found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {transactionPage && transactionPage.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {transactionPage.page + 1} of {transactionPage.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(transactionPage.totalPages - 1, p + 1))}
                  disabled={page >= transactionPage.totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <TransactionDetailDialog id={selectedTxId} onClose={() => setSelectedTxId(null)} />
    </div>
  );
}
