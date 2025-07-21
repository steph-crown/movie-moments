"use client";

import { ArrowRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Badge } from "@/components/home/badge";
import { Gradient } from "@/components/home/gradient";
import { Grainify } from "@/components/home/grainify";
import { Button } from "@/components/home/ui/button";
import Link from "next/link";
import { Logo } from "../logo";
import { Quote } from "../quote";

// Reusable animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function Section() {
  return (
    <main className="container space-y-4 p-4 mx-auto !max-w-[1200px]">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="w-full flex flex-col rounded-3xl bg-[#6365F1] text-[#F8FAFC] relative isolate overflow-hidden sm:gap-y-16 gap-y-8 md:p-12 p-6"
      >
        <Grainify className="opacity-25" />
        <div className="bg-[rgba(255,255,255,0)] bg-[linear-gradient(#eaeaea_1.2px,_transparent_1.2px),_linear-gradient(to_right,_#eaeaea_1.2px,_rgba(255,255,255,0)_1.2px)] bg-[length:24px_24px] absolute inset-0 rounded-3xl -z-[1] opacity-10 [clip-path:circle(40%)]" />

        <motion.div
          variants={fadeInUp}
          className="flex justify-between items-center"
        >
          <Logo color="white" />
          <Link href="/auth/login" className="block">
            <Button className="rounded-[0.625rem] bg-white hover:bg-white/80 text-[#6366f1]">
              Login
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="flex flex-col items-center gap-y-8"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-inter font-semibold tracking-tight text-balance sm:text-8xl text-center text-5xl"
          >
            Share Every Movie Moment
          </motion.h2>

          <motion.h1
            variants={fadeInUp}
            className="text-center text-pretty text-lg max-w-md"
          >
            You know that feeling when something incredible happens in a movie
            and you just need to tell someone? Now you can share those reactions
            at the exact timestamp with friends, even if they&apos;re watching
            weeks later.
          </motion.h1>
        </motion.div>

        <motion.div variants={scaleIn}>
          <Link href="/auth/signup" className="block mx-auto w-max">
            <Button className="mx-auto rounded-[0.625rem] text-[#6366f1] bg-white hover:bg-white/80">
              Start sharing moments
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Story Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="w-full flex flex-col rounded-3xl relative isolate gap-y-8 bg-[#F1F1FE] text-[#0A0A0A] overflow-hidden md:p-12 p-6"
      >
        <Grainify />
        <Gradient className="absolute right-0" />

        <motion.div variants={slideInLeft}>
          <Badge text="THE STORY" />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="flex flex-col gap-y-8"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-inter tracking-tight text-balance text-5xl font-light sm:text-7xl"
          >
            A Simple Wish
          </motion.h2>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Quote />
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="w-full flex flex-col rounded-3xl relative isolate gap-y-8 bg-[#F1F1FE] text-[#0A0A0A] overflow-hidden md:p-12 p-6"
      >
        <Grainify />
        <Gradient className="absolute bottom-0 translate-y-1/2" />
        <div className="bg-[length:12px_12px] opacity-70 absolute inset-0 -z-[1] translate-x-1/2 -translate-y-1/2 [clip-path:ellipse(50%_50%_at_50%_50%)] bg-[linear-gradient(0deg,_rgba(255,255,255,0)_50%,_#D8E1E9_50%)]" />

        <motion.div variants={slideInLeft}>
          <Badge text="FEATURES" />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="flex flex-col gap-y-8"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-inter tracking-tight text-balance text-5xl font-light sm:text-7xl"
          >
            For Movie Enthusiasts
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid gap-8 sm:grid-cols-1 md:grid-cols-2"
        >
          <motion.div variants={staggerContainer} className="space-y-8">
            <motion.div
              variants={slideInLeft}
              className="p-8 rounded-2xl bg-background shadow-md"
            >
              <h3 className="font-inter text-2xl font-bold mb-4">
                Instant Moment Capture
              </h3>
              <p className="text-[#788287]">
                Create timestamp discussions in seconds. Just enter the movie
                and timestamp to share reactions that friends can discover
                exactly when they reach that same moment.
              </p>
            </motion.div>

            <motion.div
              variants={slideInLeft}
              className="p-8 rounded-2xl bg-background shadow-md"
            >
              <h3 className="font-inter text-2xl font-bold mb-4">
                Universal Compatibility
              </h3>
              <p className="text-[#788287]">
                Works with any movie or series, regardless of where you&apos;re
                watching. Share moments from your favorite films and shows
                without being tied to specific services.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={slideInRight}
            className="p-8 rounded-2xl flex flex-col justify-between bg-background shadow-md"
          >
            <div className="flex flex-col">
              <h3 className="font-inter text-2xl font-bold mb-4">
                Smart Spoiler Protection
              </h3>
              <p className="text-[#788287] mb-6">
                Automatically hides reactions from future scenes and episodes.
                Friends see your thoughts exactly when they want to, creating
                perfect spoiler-free discovery.
              </p>
            </div>

            <Link href="/auth/signup" className="block">
              <Button className="rounded-[0.625rem] bg-[#6366f1] !w-full">
                Start sharing moments
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="w-full flex flex-col rounded-3xl bg-[#6365F1] text-[#F8FAFC] relative isolate overflow-hidden gap-y-8 md:p-12 p-6"
      >
        <Grainify className="opacity-25" />
        <div className="bg-[rgba(255,255,255,0)] bg-[linear-gradient(#eaeaea_1.2px,_transparent_1.2px),_linear-gradient(to_right,_#eaeaea_1.2px,_rgba(255,255,255,0)_1.2px)] bg-[length:24px_24px] absolute inset-0 rounded-3xl -z-[1] opacity-10 [clip-path:circle(40%)]" />

        <motion.div variants={scaleIn} className="flex justify-center">
          <Badge text="Get started" className="bg-background mx-auto" />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="flex flex-col items-center gap-y-8 max-w-xl mx-auto"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-inter tracking-tight text-balance text-center text-5xl sm:text-7xl"
          >
            Share Every Movie Moments
          </motion.h2>
        </motion.div>

        <motion.div variants={scaleIn}>
          <Link href="/auth/signup" className="block mx-auto w-max">
            <Button className="mx-auto text-[#6366f1] bg-white rounded-[0.625rem]">
              Start sharing moments
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.p
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="mb-8 mt-4 text-center font-medium"
      >
        For the love of movies. Built by{" "}
        <a
          href="https://stephcrown.com"
          className="text-primary font-semibold underline"
        >
          Stephen
        </a>{" "}
        &copy; {new Date().getFullYear()}{" "}
      </motion.p>
    </main>
  );
}
