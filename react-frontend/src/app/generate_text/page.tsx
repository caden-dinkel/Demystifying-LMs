"use client";

import Navbar from "@/components/navBar";
import React from "react";
import { TextGenerator } from "@/components/textGen";
import styles from "@/styles/main-layout.module.css";

export default function GenerateText() {
  return (
    <>
      <Navbar />
      <main className={styles.baseMain}>
        <TextGenerator />
      </main>
    </>
  );
}
