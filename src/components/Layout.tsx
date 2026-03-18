import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FeedbackPopup from "./FeedbackPopup";
import EidBanner from "./EidBanner";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <EidBanner />
      <main className="flex-1">{children}</main>
      <Footer />
      <FeedbackPopup />
    </div>
  );
}
