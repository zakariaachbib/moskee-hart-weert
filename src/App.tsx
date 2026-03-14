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
import WordDrager from "@/pages/WordDrager";
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
import EduAdminOverview from "@/pages/education/EduAdminOverview";
import UserManagement from "@/pages/education/UserManagement";
import ManagementDashboard from "@/pages/education/ManagementDashboard";
import TeacherDashboard from "@/pages/education/TeacherDashboard";
import StudentDashboard from "@/pages/education/StudentDashboard";
import ClassManagement from "@/pages/education/ClassManagement";
import EnrollmentManagement from "@/pages/education/EnrollmentManagement";
import AttendanceManagement from "@/pages/education/AttendanceManagement";
import AssignmentsOverview from "@/pages/education/AssignmentsOverview";
import DocumentManagement from "@/pages/education/DocumentManagement";
import AcademicCalendar from "@/pages/education/AcademicCalendar";
import ReportsManagement from "@/pages/education/ReportsManagement";
import AnnouncementsManagement from "@/pages/education/AnnouncementsManagement";

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
            <Route path="/login" element={<Login />} />

            {/* Education routes */}
            <Route path="/education/admin" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><EduAdminOverview /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/gebruikers" element={<EduProtectedRoute allowedRoles={["admin"]}><EduAdminDashboard><UserManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/klassen" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><ClassManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/inschrijvingen" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><EnrollmentManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/aanwezigheid" element={<EduProtectedRoute allowedRoles={["admin", "education_management", "teacher"]}><EduAdminDashboard><AttendanceManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/opdrachten" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><AssignmentsOverview /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/documenten" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><DocumentManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/kalender" element={<EduProtectedRoute allowedRoles={["admin", "education_management", "teacher"]}><EduAdminDashboard><AcademicCalendar /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/rapportages" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><ReportsManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/admin/mededelingen" element={<EduProtectedRoute allowedRoles={["admin", "education_management", "teacher"]}><EduAdminDashboard><AnnouncementsManagement /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/management" element={<EduProtectedRoute allowedRoles={["admin", "education_management"]}><EduAdminDashboard><ManagementDashboard /></EduAdminDashboard></EduProtectedRoute>} />
            <Route path="/education/teacher" element={<EduProtectedRoute allowedRoles={["admin", "teacher"]}><TeacherDashboard /></EduProtectedRoute>} />
            <Route path="/education/student" element={<EduProtectedRoute allowedRoles={["admin", "student"]}><StudentDashboard /></EduProtectedRoute>} />

            {/* Public routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/over-ons" element={<Layout><OverOns /></Layout>} />
            <Route path="/gebedstijden" element={<Layout><Gebedstijden /></Layout>} />
            <Route path="/activiteiten" element={<Layout><Activiteiten /></Layout>} />
            <Route path="/doneren" element={<Layout><Doneren /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/word-lid" element={<Layout><WordLid /></Layout>} />
            <Route path="/word-drager" element={<Layout><WordDrager /></Layout>} />
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
