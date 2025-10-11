"use client";

import Navbar from "@/components/navBar";
import React from "react";
import { Tokenizer } from "@/components/tokenizeText";
import styles from "@/styles/main-layout.module.css";

export default function TokenizeText() {
  return (
    <>
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        <Tokenizer />
      </main>
    </>
  );
}
