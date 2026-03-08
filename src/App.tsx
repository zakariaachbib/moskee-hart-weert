import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import OverOns from "@/pages/OverOns";
import Gebedstijden from "@/pages/Gebedstijden";
import Activiteiten from "@/pages/Activiteiten";
import Doneren from "@/pages/Doneren";
import Contact from "@/pages/Contact";
import WordLid from "@/pages/WordLid";
import Onderwijs from "@/pages/Onderwijs";
import Media from "@/pages/Media";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Admin routes without Layout */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />

            {/* Public routes with Layout */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/over-ons" element={<Layout><OverOns /></Layout>} />
            <Route path="/gebedstijden" element={<Layout><Gebedstijden /></Layout>} />
            <Route path="/activiteiten" element={<Layout><Activiteiten /></Layout>} />
            <Route path="/doneren" element={<Layout><Doneren /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/word-lid" element={<Layout><WordLid /></Layout>} />
            <Route path="/onderwijs" element={<Layout><Onderwijs /></Layout>} />
            <Route path="/media" element={<Layout><Media /></Layout>} />
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
