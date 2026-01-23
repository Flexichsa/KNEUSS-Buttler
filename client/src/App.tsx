import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import CsvStatusPage from "@/pages/csv-status";
import KnowledgeBase from "@/pages/knowledge-base";

function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function ProtectedKnowledgeBase() {
  return (
    <ProtectedRoute>
      <KnowledgeBase />
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/csv-status" component={CsvStatusPage} />
      <Route path="/wissensdatenbank" component={ProtectedKnowledgeBase} />
      <Route path="/" component={ProtectedDashboard} />
      <Route path="/calendar" component={ProtectedDashboard} />
      <Route path="/mail" component={ProtectedDashboard} />
      <Route path="/todos" component={ProtectedDashboard} />
      <Route path="/notes" component={ProtectedDashboard} />
      <Route path="/assistant" component={ProtectedDashboard} />
      <Route path="/settings" component={ProtectedDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
