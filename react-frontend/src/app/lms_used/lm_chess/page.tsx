import AIChessGame from "@/components/chess/chessboard";
import Navbar from "@/components/navigation/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";

export default function LM_Chess() {
  return (
    <>
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        {/* Chess Component */}
        <AIChessGame />
      </main>
    </>
  );
}
