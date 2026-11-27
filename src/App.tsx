import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PageTracker } from "@/components/PageTracker";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetupOwner from "./pages/SetupOwner";
import Admin from "./pages/Admin";
import AdminMessages from "./pages/AdminMessages";
import AdminDonations from "./pages/AdminDonations";
import AdminStats from "./pages/AdminStats";
import AdminSuggestions from "./pages/AdminSuggestions";
import Donations from "./pages/Donations";
import NotFound from "./pages/NotFound";
import MinistryPage from "./pages/MinistryPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTracker>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/setup" element={<SetupOwner />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/mensajes" element={<AdminMessages />} />
              <Route path="/admin/donaciones" element={<AdminDonations />} />
              <Route path="/admin/estadisticas" element={<AdminStats />} />
              <Route path="/admin/sugerencias" element={<AdminSuggestions />} />
              <Route path="/donaciones" element={<Donations />} />
              <Route path="/ministerios/:slug" element={<MinistryPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTracker>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
