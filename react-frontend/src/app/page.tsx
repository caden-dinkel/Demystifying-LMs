// react-frontend/src/app/page.tsx
// DO NOT add "use client" here.
// This must be a Server Component to read files from the server.

import Navbar from "@/components/navigation/navBar";
import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";
import styles from "@/styles/main-layout.module.css";

export default function Home() {
  // Construct the full path to the .md file
  const mdFilePath = path.join(
    process.cwd(),
    "src",
    "app",
    "content",
    "home.md"
  );

  let content = "Error: home.md file not found."; // Default message

  try {
    // Read the content of the file
    content = fs.readFileSync(mdFilePath, "utf8");
  } catch (err) {
    console.error(err);
  }

  return (
    <>
      <Navbar />
      <main className={styles.baseMain}>
        <h1 className="text-4xl font-bold tracking-tight mb-6">
          Demystifying Language Models
        </h1>
        <article className="prose lg:prose-xl dark:prose-invert max-w-5xl mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </main>
    </>
  );
}
