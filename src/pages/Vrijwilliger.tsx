import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import { VolunteerForm } from "@/pages/Activiteiten";

export default function Vrijwilliger() {
  return (
    <>
      <section className="relative bg-brown py-20 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="container relative text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl text-cream"
          >
            Vrijwilliger worden
          </motion.h1>
        </div>
      </section>

      <section className="py-12 md:py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <SectionHeading
            subtitle="Aanmelden"
            title="Zet uw tijd & talent in"
            description="Word vrijwilliger bij Nahda Moskee Weert. Vul het formulier in — uw aanmelding wordt door het bestuur getoetst."
          />
          <div className="mt-10">
            <VolunteerForm />
          </div>
        </div>
      </section>
    </>
  );
}
