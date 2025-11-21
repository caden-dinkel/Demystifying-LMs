// react-frontend/src/app/page.tsx
// DO NOT add "use client" here.
// This must be a Server Component to read files from the server.

import Navbar from "@/components/navigation/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";
import { LMTextarea } from "@/components/lmTextarea";
import fs from "fs";
import path from "path";
// Import Node.js modules for reading files
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// Import the markdown renderer

export default function Home() {
  const handleSend = (input: string, lm: string) => {
    // Handle the send action from LMTextarea
  };
  const mdFilePath = path.join(
    process.cwd(),
    "src",
    "app",
    "content",
    "home.md"
  );

  let content = "Error: tokenizer.md file not found."; // Default message

  try {
    // Read the content of the file
    content = fs.readFileSync(mdFilePath, "utf8");
  } catch (err) {
    console.error(err);
  }
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center p-12 md:p-24">
        <article className="prose lg:prose-xl dark:prose-invert max-w-5xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
        {/* Main landing page content will go here. */}
      </main>
    </>
  );
}
