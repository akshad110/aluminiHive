import { PropsWithChildren } from "react";
import { motion, Variants } from "framer-motion";

type RevealProps = PropsWithChildren<{
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
}>;

export default function Reveal({ children, delay = 0, duration = 0.6, y = 20, x = 0 }: RevealProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y, x },
    visible: { opacity: 1, y: 0, x: 0 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
