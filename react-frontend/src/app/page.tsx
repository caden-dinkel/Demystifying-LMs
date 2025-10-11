// Add this line at the very top. It tells Next.js to run this code in the browser.
"use client";

//This is to change gits
import Navbar from "@/components/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";

export default function Home() {
  return (
    <>
      <Navbar />
    </>
  );
}
