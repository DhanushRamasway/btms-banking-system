import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("btms_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/csv")) return res.blob() as unknown as T;
  return res.json();
}

export type UserProfile = { id: string; fullName: string; email: string; phone: string; role: string; isActive: boolean; createdAt: string };
export type Beneficiary = { id: string; userId: string; beneficiaryName: string; accountNumber: string; bankName: string; ifscCode: string; isActive: boolean; createdAt: string };
export type Transaction = { id: string; fromAccountId: string | null; toAccountId: string | null; fromAccountNumber: string | null; toAccountNumber: string | null; amount: number; type: string; status: string; description: string; referenceNo: string; createdAt: string };
export type ListTransactionsType = "CREDIT" | "DEBIT" | "TRANSFER";

export function useHealthCheck(opts?: any) {
  return useQuery({ queryKey: ["/api/healthz"], queryFn: () => apiFetch<{ status: string }>("/api/healthz"), ...opts?.query });
}

export function useLogin() {
  return useMutation({ mutationFn: ({ data }: { data: { email: string; password: string } }) => apiFetch<{ token: string; refreshToken: string; user: UserProfile }>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }) });
}

export function useRegister() {
  return useMutation({ mutationFn: ({ data }: { data: { fullName: string; email: string; phone: string; password: string } }) => apiFetch<{ token: string; refreshToken: string; user: UserProfile }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }) });
}

export function useLogout() {
  return useMutation({ mutationFn: () => apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" }) });
}

export function useGetProfile(opts?: any) {
  return useQuery({ queryKey: ["/api/user/profile"], queryFn: () => apiFetch<UserProfile>("/api/user/profile"), ...opts?.query });
}

export function useUpdateProfile() {
  return useMutation({ mutationFn: ({ data }: { data: { fullName?: string; phone?: string } }) => apiFetch<UserProfile>("/api/user/profile", { method: "PUT", body: JSON.stringify(data) }) });
}

export function useChangePassword() {
  return useMutation({ mutationFn: ({ data }: { data: { currentPassword: string; newPassword: string; confirmPassword: string } }) => apiFetch<{ success: boolean }>("/api/user/change-password", { method: "PUT", body: JSON.stringify(data) }) });
}

export function useGetMyAccount(opts?: any) {
  return useQuery({ queryKey: ["/api/account/me"], queryFn: () => apiFetch<any>("/api/account/me"), ...opts?.query });
}

export function useGetAccountSummary(opts?: any) {
  return useQuery({ queryKey: ["/api/account/summary"], queryFn: () => apiFetch<any>("/api/account/summary"), ...opts?.query });
}

export function useGetMiniStatement(opts?: any) {
  return useQuery({ queryKey: ["/api/account/mini-statement"], queryFn: () => apiFetch<Transaction[]>("/api/account/mini-statement"), ...opts?.query });
}

export function useGetDashboardStats(opts?: any) {
  return useQuery({ queryKey: ["/api/dashboard/stats"], queryFn: () => apiFetch<any>("/api/dashboard/stats"), ...opts?.query });
}

export function useGetRecentActivity(opts?: any) {
  return useQuery({ queryKey: ["/api/dashboard/activity"], queryFn: () => apiFetch<any[]>("/api/dashboard/activity"), ...opts?.query });
}

export function useInitiateTransfer() {
  return useMutation({ mutationFn: ({ data }: { data: { toAccountNumber: string; amount: number; description?: string } }) => apiFetch<any>("/api/transfer/initiate", { method: "POST", body: JSON.stringify(data) }) });
}

export function useGetTransferStatus(referenceNo: string, opts?: any) {
  return useQuery({ queryKey: ["/api/transfer/status", referenceNo], queryFn: () => apiFetch<Transaction>(`/api/transfer/status/${referenceNo}`), enabled: !!referenceNo, ...opts?.query });
}

export function useListTransactions(params: { page?: number; size?: number; type?: string; startDate?: string; endDate?: string }, opts?: any) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.type && params.type !== "ALL") searchParams.set("type", params.type);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  return useQuery({ queryKey: ["/api/transactions", params], queryFn: () => apiFetch<{ content: Transaction[]; totalElements: number; totalPages: number; page: number; size: number }>(`/api/transactions?${searchParams}`), ...opts?.query });
}

export function useGetTransaction(id: string, opts?: any) {
  return useQuery({ queryKey: ["/api/transactions", id], queryFn: () => apiFetch<Transaction>(`/api/transactions/${id}`), enabled: !!id, ...opts?.query });
}

export function useListBeneficiaries(opts?: any) {
  return useQuery({ queryKey: ["/api/beneficiaries"], queryFn: () => apiFetch<Beneficiary[]>("/api/beneficiaries"), ...opts?.query });
}

export function useCreateBeneficiary() {
  return useMutation({ mutationFn: ({ data }: { data: { beneficiaryName: string; accountNumber: string; bankName: string; ifscCode: string } }) => apiFetch<Beneficiary>("/api/beneficiaries", { method: "POST", body: JSON.stringify(data) }) });
}

export function useUpdateBeneficiary() {
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: { beneficiaryName?: string; bankName?: string; ifscCode?: string } }) => apiFetch<Beneficiary>(`/api/beneficiaries/${id}`, { method: "PUT", body: JSON.stringify(data) }) });
}

export function useDeleteBeneficiary() {
  return useMutation({ mutationFn: ({ id }: { id: string }) => apiFetch<{ success: boolean }>(`/api/beneficiaries/${id}`, { method: "DELETE" }) });
}
