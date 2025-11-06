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
        <StepTokenGen />
      </main>
    </>
  );
}
