import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/over-ons" element={<OverOns />} />
            <Route path="/gebedstijden" element={<Gebedstijden />} />
            <Route path="/activiteiten" element={<Activiteiten />} />
            <Route path="/doneren" element={<Doneren />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/word-lid" element={<WordLid />} />
            <Route path="/onderwijs" element={<Onderwijs />} />
            <Route path="/media" element={<Media />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
