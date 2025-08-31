import { PropsWithChildren, useEffect, useRef } from "react";
import { motion, Variants, useAnimation, useInView } from "framer-motion";

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

  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const inView = useInView(ref, { amount: 0.2 });

  useEffect(() => {
    if (inView) controls.start("visible");
    else controls.start("hidden");
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={controls}
      transition={{ delay, duration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
