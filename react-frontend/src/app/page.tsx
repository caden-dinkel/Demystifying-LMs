// react-frontend/src/app/page.tsx
// DO NOT add "use client" here.
// This must be a Server Component to read files from the server.

import Navbar from "@/components/navigation/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";
import { LMTextarea } from "@/components/lmTextarea";

// Import Node.js modules for reading files

// Import the markdown renderer

export default function Home() {
  const handleSend = (input: string, lm: string) => {
    // Handle the send action from LMTextarea
  };
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center p-12 md:p-24">
        {/* Main landing page content will go here. */}
        High Level Overview and Introduction to the Application.
      </main>
    </>
  );
}
