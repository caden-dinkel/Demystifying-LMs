import Navbar from "@/components/navigation/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import fs from "fs";
import path from "path";
import { TokenPredictionAnimation } from "@/components/TokenPredictionAnimation";
import { PageNavigation } from "@/components/navigation/PageNavigation";

export default function PredictNext() {
  // Construct the full path to the .md file
  const mdFilePath = path.join(
    process.cwd(),
    "src",
    "app",
    "content",
    "token_generation.md"
  );

  let content = "Error: token_generation.md file not found.";

  try {
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
        <article className="prose lg:prose-xl dark:prose-invert max-w-7xl mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
        <TokenPredictionAnimation />
        <PageNavigation
          previousPage={{
            href: "/lms_work/encode_tokens",
            label: "Tokenizing Text",
          }}
          nextPage={{
            href: "/lms_work/decode_tokens",
            label: "Searching for Words",
          }}
        />
      </main>
    </>
  );
}
