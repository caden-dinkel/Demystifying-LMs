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
        {/* Markov Token Prediction Component */}
        Future component for predicting the next word will go here.
      </main>
    </>
  );
}
