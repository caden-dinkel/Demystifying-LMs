"use client";

import Navbar from "@/components/navigation/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";

export default function PredictNext() {
  return (
    <>
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Predict Next Token
          </h1>
          <p className="text-muted-foreground mb-4">
            Future implementation: This page will demonstrate how language
            models predict the next token given a sequence of input tokens.
          </p>
          <div className="p-6 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground italic">
              🚧 Coming soon: Interactive next token prediction visualization
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
