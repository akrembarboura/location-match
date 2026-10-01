"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function NotFound() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20">
      <motion.div
        className="mx-auto flex max-w-md flex-col items-center text-center"
        variants={containerVariants}
        initial={shouldReduceMotion ? "visible" : "hidden"}
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants}>
          <Logo compact className="scale-110" />
        </motion.div>

        {/* 404 */}
        <motion.div
          variants={itemVariants}
          className="relative mt-12"
        >
          <motion.h1
            className="font-display text-8xl font-bold tracking-tighter text-foreground/90 sm:text-9xl"
            animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            404
          </motion.h1>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={itemVariants}
          className="mt-6 space-y-3"
        >
          <h2 className="text-xl font-semibold text-foreground">
            Cette page n'existe pas.
          </h2>

          <p className="leading-relaxed text-muted-foreground">
            La page que vous recherchez semble avoir changé d'adresse.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.02] hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Retour à l'accueil
          </Link>

          <Link
            href="/houses"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-8 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explorer les locations
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
