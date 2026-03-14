import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
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
import Preken from "@/pages/Preken";
import Bekeerlingen from "@/pages/Bekeerlingen";
import Bedankt from "@/pages/Bedankt";
import AdminLogin from "@/pages/AdminLogin";
import Login from "@/pages/Login";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminActiviteiten from "@/pages/admin/AdminActiviteiten";
import AdminBerichten from "@/pages/admin/AdminBerichten";
import AdminLeden from "@/pages/admin/AdminLeden";
import AdminDonaties from "@/pages/admin/AdminDonaties";
import AdminPreken from "@/pages/admin/AdminPreken";
import AdminCrowdfunding from "@/pages/admin/AdminCrowdfunding";
import CrowdfundingOverview from "@/pages/CrowdfundingOverview";
import CrowdfundingProject from "@/pages/CrowdfundingProject";
import NotFound from "@/pages/NotFound";
import EduProtectedRoute from "@/components/education/EduProtectedRoute";
import EduAdminDashboard from "@/pages/education/EduAdminDashboard";
import ManagementDashboard from "@/pages/education/ManagementDashboard";
import TeacherDashboard from "@/pages/education/TeacherDashboard";
import StudentDashboard from "@/pages/education/StudentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Admin routes */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/activiteiten" element={<AdminActiviteiten />} />
            <Route path="/admin/berichten" element={<AdminBerichten />} />
            <Route path="/admin/leden" element={<AdminLeden />} />
            <Route path="/admin/donaties" element={<AdminDonaties />} />
            <Route path="/admin/preken" element={<AdminPreken />} />
            <Route path="/admin/crowdfunding" element={<AdminCrowdfunding />} />
            <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />

            {/* Public routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/over-ons" element={<Layout><OverOns /></Layout>} />
            <Route path="/gebedstijden" element={<Layout><Gebedstijden /></Layout>} />
            <Route path="/activiteiten" element={<Layout><Activiteiten /></Layout>} />
            <Route path="/doneren" element={<Layout><Doneren /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/word-lid" element={<Layout><WordLid /></Layout>} />
            <Route path="/onderwijs" element={<Layout><Onderwijs /></Layout>} />
            <Route path="/media" element={<Layout><Media /></Layout>} />
            <Route path="/preken" element={<Layout><Preken /></Layout>} />
            <Route path="/bekeerlingen" element={<Layout><Bekeerlingen /></Layout>} />
            <Route path="/crowdfunding" element={<Layout><CrowdfundingOverview /></Layout>} />
            <Route path="/crowdfunding/:slug" element={<Layout><CrowdfundingProject /></Layout>} />
            <Route path="/bedankt" element={<Layout><Bedankt /></Layout>} />
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </LanguageProvider>
);

export default App;
