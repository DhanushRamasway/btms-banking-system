import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  useListBeneficiaries, 
  useCreateBeneficiary,
  useUpdateBeneficiary,
  useDeleteBeneficiary 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Beneficiary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreVertical, Edit2, Trash2, UserCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  beneficiaryName: z.string().min(2, "Name must be at least 2 characters."),
  accountNumber: z.string().min(8, "Account number must be at least 8 characters."),
  bankName: z.string().min(2, "Bank name must be at least 2 characters."),
  ifscCode: z.string().min(5, "IFSC/Routing code must be at least 5 characters."),
});

export default function Beneficiaries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: beneficiaries, isLoading } = useListBeneficiaries({
    query: {
      queryKey: ["/api/beneficiaries"]
    }
  });

  const createMutation = useCreateBeneficiary();
  const updateMutation = useUpdateBeneficiary();
  const deleteMutation = useDeleteBeneficiary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiaryName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
  });

  const filteredBeneficiaries = beneficiaries?.filter(b => 
    b.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.accountNumber.includes(searchTerm) ||
    b.bankName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddForm = () => {
    setEditingBeneficiary(null);
    form.reset({
      beneficiaryName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    form.reset({
      beneficiaryName: beneficiary.beneficiaryName,
      accountNumber: beneficiary.accountNumber,
      bankName: beneficiary.bankName,
      ifscCode: beneficiary.ifscCode,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingBeneficiary) {
        await updateMutation.mutateAsync({
          id: editingBeneficiary.id,
          data: {
            beneficiaryName: values.beneficiaryName,
            bankName: values.bankName,
            ifscCode: values.ifscCode,
          }
        });
        toast({ title: "Beneficiary updated successfully" });
      } else {
        await createMutation.mutateAsync({ data: values });
        toast({ title: "Beneficiary added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"] });
      setIsFormOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingId });
      toast({ title: "Beneficiary deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete beneficiary.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beneficiaries</h1>
          <p className="text-muted-foreground mt-1">Manage your saved accounts for quick transfers.</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Beneficiary
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, bank or account..." 
              className="pl-9 max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="shadow-none">
                  <CardContent className="p-4 flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBeneficiaries && filteredBeneficiaries.length > 0 ? (
              filteredBeneficiaries.map((beneficiary) => (
                <Card key={beneficiary.id} className="group shadow-none hover:border-primary/50 hover:shadow-md transition-all">
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="bg-primary/10 text-primary h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                        <span className="font-semibold">{beneficiary.beneficiaryName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-semibold truncate" title={beneficiary.beneficiaryName}>
                          {beneficiary.beneficiaryName}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono mt-1">
                          {beneficiary.accountNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {beneficiary.bankName} • {beneficiary.ifscCode}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(beneficiary)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingId(beneficiary.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <UserCircle2 className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-lg font-medium">No beneficiaries found</p>
                <p className="text-sm">Try adjusting your search or add a new one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBeneficiary ? "Edit Beneficiary" : "Add Beneficiary"}</DialogTitle>
            <DialogDescription>
              {editingBeneficiary ? "Update the beneficiary's details." : "Enter the details of the new beneficiary account."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="beneficiaryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" disabled={!!editingBeneficiary} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing / IFSC</FormLabel>
                      <FormControl>
                        <Input placeholder="Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Beneficiary"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the beneficiary
              from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirmDelete(); }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
