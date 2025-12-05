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
  // Construct the full path to the .md file
  const mdFilePath = path.join(
    process.cwd(),
    "src",
    "app",
    "content",
    "home",
    "tokenizer_ex.md"
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
      </main>
    </>
  );
}
