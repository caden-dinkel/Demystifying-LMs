"use client";

import Navbar from "@/components/navigation/navBar";
import React from "react";
import { StepTokenGen } from "@/components/search_tokens/stepGeneration";
import styles from "@/styles/main-layout.module.css";

export default function LM_Planning() {
  return (
    <>
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            LM Planning Overview
          </h1>
          <p className="text-muted-foreground mb-4">
            Future implementation: This page will explain how language models
            can be used for planning tasks and decision-making.
          </p>
          <div className="p-6 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground italic">
              🚧 Coming soon: Overview of LM-based planning approaches and
              concepts
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
