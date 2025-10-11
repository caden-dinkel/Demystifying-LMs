// react-frontend/src/app/page.tsx
"use client";

import Navbar from "@/components/navBar";
import React from "react";
import { StepTokenGen } from "@/components/stepGeneration";
import styles from "@/styles/main-layout.module.css";

export default function GenerateTokens() {
  return (
    <>
      <Navbar />
      <main className={styles.baseMain}>
        <StepTokenGen />
      </main>
    </>
  );
}
