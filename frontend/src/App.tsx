import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, PrivateRoute } from "@/lib/auth";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Transfer from "@/pages/transfer";
import Transactions from "@/pages/transactions";
import Beneficiaries from "@/pages/beneficiaries";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">{() => <Redirect to="/dashboard" />}</Route>
      <Route path="/dashboard">{() => <PrivateRoute component={() => <PrivateLayout><Dashboard /></PrivateLayout>} />}</Route>
      <Route path="/transfer">{() => <PrivateRoute component={() => <PrivateLayout><Transfer /></PrivateLayout>} />}</Route>
      <Route path="/transactions">{() => <PrivateRoute component={() => <PrivateLayout><Transactions /></PrivateLayout>} />}</Route>
      <Route path="/beneficiaries">{() => <PrivateRoute component={() => <PrivateLayout><Beneficiaries /></PrivateLayout>} />}</Route>
      <Route path="/profile">{() => <PrivateRoute component={() => <PrivateLayout><Profile /></PrivateLayout>} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
