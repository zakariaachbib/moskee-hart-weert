import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FeedbackPopup from "./FeedbackPopup";
import EidPopup from "./EidPopup";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FeedbackPopup />
      <EidPopup />
    </div>
  );
}
