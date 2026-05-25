import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useHealthCheck } from "@/lib/api";
import { Building2, LayoutDashboard, SendHorizontal, ListOrdered, Users, User, LogOut, Menu, X, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transfer", label: "Transfer Funds", icon: SendHorizontal },
  { href: "/transactions", label: "Transactions", icon: ListOrdered },
  { href: "/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { data: health } = useHealthCheck({ query: { queryKey: ["/api/healthz"], refetchInterval: 60000 } });

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <header className="flex h-16 w-full items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2 font-semibold text-primary"><Building2 className="h-6 w-6" /><span>BTMS</span></div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 md:justify-center">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-sidebar-primary-foreground tracking-tight">
            <Building2 className="h-6 w-6" /><span>BTMS</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden text-sidebar-foreground" onClick={() => setIsMobileMenuOpen(false)}><X className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-auto py-6">
          <nav className="grid gap-2 px-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Icon className="h-4 w-4" />{item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-sidebar-primary-foreground">{user?.fullName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" />Logout
          </Button>
          <div className="mt-4 px-2 flex items-center gap-2 text-xs text-sidebar-foreground/40">
            <Wifi className={`h-3 w-3 ${health?.status === "ok" ? "text-green-500" : "text-red-500"}`} />
            System {health?.status === "ok" ? "Online" : "Offline"}
          </div>
        </div>
      </aside>
      <main className="flex-1 w-full flex flex-col min-w-0">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
