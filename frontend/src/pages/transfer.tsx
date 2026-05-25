import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  useInitiateTransfer, 
  useListBeneficiaries,
  useGetTransferStatus
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, SendHorizontal, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  toAccountNumber: z.string().min(8, { message: "Account number must be at least 8 characters." }),
  amount: z.coerce.number().min(1, { message: "Amount must be at least $1." }),
  description: z.string().optional(),
});

function TransferStatusCheck({ referenceNo }: { referenceNo: string }) {
  const { data: status, refetch, isFetching } = useGetTransferStatus(referenceNo, {
    query: {
      queryKey: ["/api/transactions/status", referenceNo],
      enabled: !!referenceNo,
    }
  });

  return (
    <div className="mt-4 flex flex-col items-center">
      <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        Check Status
      </Button>
      {status && (
        <p className="text-xs text-muted-foreground mt-2">
          Current network status: <span className="font-semibold">{status.status}</span>
        </p>
      )}
    </div>
  );
}

export default function Transfer() {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(null);
  const [transferResult, setTransferResult] = useState<{ success: boolean; referenceNo?: string; message?: string } | null>(null);

  const { data: beneficiaries, isLoading: isLoadingBeneficiaries } = useListBeneficiaries({
    query: {
      queryKey: ["/api/beneficiaries"]
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toAccountNumber: "",
      amount: 0,
      description: "",
    },
  });

  const transferMutation = useInitiateTransfer();

  function onPreSubmit(values: z.infer<typeof formSchema>) {
    setFormData(values);
    setShowConfirm(true);
  }

  async function onConfirm() {
    if (!formData) return;
    
    try {
      const response = await transferMutation.mutateAsync({
        data: formData
      });
      setTransferResult({
        success: true,
        referenceNo: response.referenceNo,
        message: response.message
      });
      toast({
        title: "Transfer successful",
        description: `Reference: ${response.referenceNo}`,
      });
    } catch (error: any) {
      setTransferResult({
        success: false,
        message: error.message || "Transfer failed"
      });
      toast({
        variant: "destructive",
        title: "Transfer failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setShowConfirm(false);
    }
  }

  const resetForm = () => {
    form.reset();
    setTransferResult(null);
    setFormData(null);
  };

  if (transferResult) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 bg-muted">
              {transferResult.success ? (
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              ) : (
                <AlertCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {transferResult.success ? "Transfer Successful" : "Transfer Failed"}
            </CardTitle>
            <CardDescription>
              {transferResult.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {transferResult.success && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-lg">${formData?.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Account</span>
                  <span className="font-medium">{formData?.toAccountNumber}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Reference No.</span>
                  <span className="font-mono bg-background px-2 py-1 rounded border">{transferResult.referenceNo}</span>
                </div>
                {transferResult.referenceNo && (
                  <TransferStatusCheck referenceNo={transferResult.referenceNo} />
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Button onClick={resetForm} className="w-full sm:w-auto">
              Make Another Transfer
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transfer Funds</h1>
        <p className="text-muted-foreground mt-1">Send money to beneficiaries or any other account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
          <CardDescription>Enter the destination account and amount.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPreSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="toAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Account</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      {!isLoadingBeneficiaries && beneficiaries && beneficiaries.length > 0 && (
                        <Select 
                          onValueChange={(val) => form.setValue("toAccountNumber", val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Beneficiaries" />
                          </SelectTrigger>
                          <SelectContent>
                            {beneficiaries.map((b) => (
                              <SelectItem key={b.id} value={b.accountNumber}>
                                {b.beneficiaryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input type="number" step="0.01" min="1" className="pl-8 text-lg font-semibold" placeholder="0.00" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What is this transfer for?" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg">
                <SendHorizontal className="mr-2 h-5 w-5" />
                Review Transfer
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription>
              Please review the details before confirming. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <span className="text-muted-foreground font-medium">Transfer Amount</span>
                <span className="text-3xl font-bold text-primary">${formData?.amount.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Account</span>
                  <span className="font-medium">{formData?.toAccountNumber}</span>
                </div>
                {formData?.description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium">{formData.description}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-none">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Ensure the account number is correct. Funds transferred to the wrong account may not be recoverable.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={transferMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={transferMutation.isPending}>
              {transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
