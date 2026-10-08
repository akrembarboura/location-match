"use client";

import { motion, type Variants } from "framer-motion";

export interface LoadingThreeDotsJumpingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingThreeDotsJumping({
  className = "",
  size = "md",
  text,
}: LoadingThreeDotsJumpingProps) {
  const jumpHeight = size === "sm" ? -14 : size === "lg" ? -32 : -22;

  const dotVariants: Variants = {
    jump: {
      transform: `translateY(${jumpHeight}px)`,
      transition: {
        duration: 0.7,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  const dotSizeClass =
    size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  const gapClass = size === "sm" ? "gap-1.5" : size === "lg" ? "gap-3.5" : "gap-2.5";

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <motion.div
        animate="jump"
        transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
        className={`flex items-center justify-center ${gapClass}`}
      >
        <motion.div
          className={`${dotSizeClass} rounded-full bg-primary shadow-xs`}
          variants={dotVariants}
        />
        <motion.div
          className={`${dotSizeClass} rounded-full bg-amber-500 shadow-xs`}
          variants={dotVariants}
        />
        <motion.div
          className={`${dotSizeClass} rounded-full bg-emerald-500 shadow-xs`}
          variants={dotVariants}
        />
      </motion.div>

      {text && (
        <p className="mt-3 text-xs font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingThreeDotsJumping;
