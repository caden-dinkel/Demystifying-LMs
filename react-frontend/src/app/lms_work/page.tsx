"use client";

import Navbar from "@/components/navigation/navBar";
import React from "react";
import { StepTokenGen } from "@/components/search_tokens/stepGeneration";
import styles from "@/styles/main-layout.module.css";

export default function TokenizeText() {
  return (
    <>
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            How Language Models Work
          </h1>
          <p className="text-muted-foreground mb-4">
            Future implementation: This page will provide a high-level overview
            of language model components and how they interact to generate text.
          </p>
          <div className="p-6 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground italic">
              🚧 Coming soon: Interactive overview of LM architecture and
              workflow
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
