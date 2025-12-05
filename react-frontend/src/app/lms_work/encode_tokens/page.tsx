import Navbar from "@/components/navigation/navBar";
import React from "react";
import { Tokenizer } from "@/components/tokenizeText";
import styles from "@/styles/main-layout.module.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import fs from "fs";
import path from "path";

export default function TokenizeText() {
  // Construct the full path to the .md file
  const mdFilePath = path.join(
    process.cwd(),
    "src",
    "app",
    "content",
    "tokenizer_home.md"
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
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        <article className="prose lg:prose-xl dark:prose-invert max-w-5xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
        <Tokenizer />
      </main>
    </>
  );
}
