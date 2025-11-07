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
        {/* Iterative Text generation animation/component */}
        Future component for combined animation will go here. Tokens -{">"}
        Model -{">"} Next Token Prediction
      </main>
    </>
  );
}
