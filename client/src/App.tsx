import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminEvents from "@/pages/admin/events";
import AdminRegistrations from "@/pages/admin/registrations";
import AdminBlacklist from "@/pages/admin/blacklist";
import CancelRegistration from "@/pages/cancel/[token]";
import Register from "@/pages/register";
import RegistrationSuccess from "@/pages/registration-success";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/registration-success" component={RegistrationSuccess} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/registrations" component={AdminRegistrations} />
      <Route path="/admin/blacklist" component={AdminBlacklist} />
      <Route path="/cancel/:token" component={CancelRegistration} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
