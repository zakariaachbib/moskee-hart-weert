import { motion } from "framer-motion";
import OrnamentalDivider from "./OrnamentalDivider";

interface Props {
  subtitle?: string;
  title: string;
  description?: string;
  light?: boolean;
}

export default function SectionHeading({ subtitle, title, description, light }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      {subtitle && (
        <span className="text-gold font-heading text-lg italic">{subtitle}</span>
      )}
      <h2 className={`font-heading text-3xl md:text-4xl mt-2 ${light ? "text-cream" : "text-foreground"}`}>
        {title}
      </h2>
      <OrnamentalDivider light={light} />
      {description && (
        <p className={`mt-2 max-w-2xl mx-auto ${light ? "text-cream/70" : "text-muted-foreground"}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
