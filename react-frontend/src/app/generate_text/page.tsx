// react-frontend/src/app/generate_text/page.tsx

// DO NOT add "use client" here.
// This must be a Server Component to read files from the server.

import Navbar from "@/components/navBar";
import React from "react";
import { TextGenerator } from "@/components/textGen";
import styles from "@/styles/main-layout.module.css";

// Import Node.js modules for reading files
import fs from "fs";
import path from "path";

// Import the markdown renderer
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function GenerateText() {
    // Construct the full path to the .md file
    const mdFilePath = path.join(
        process.cwd(),
        "src",
        "app",
        "content",
        "text_generation",
        "demo_intro.md"
    );

    let descriptionContent = "Error: generate_text.md file not found."; // Default message

    try {
        // Read the content of the file
        descriptionContent = fs.readFileSync(mdFilePath, "utf8");
    } catch (err) {
        console.error(err);
    }

  return (
    <>
      <Navbar />
          <main className="flex flex-col items-center p-12 md:p-24">
              <div className="w-full max-w-5xl">
                  <article className="prose lg:prose-xl dark:prose-invert max-w-5xl pb-8">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {descriptionContent}
                      </ReactMarkdown>
                  </article>
                  <TextGenerator />
              </div>
      </main>
    </>
  );
}
