// react-frontend/src/app/page.tsx

// DO NOT add "use client" here.
// This must be a Server Component to read files from the server.

import Navbar from "@/components/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";

// Import Node.js modules for reading files
import fs from "fs";
import path from "path";

// Import the markdown renderer
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
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
            <Navbar />
            <main className="flex flex-col items-center p-12 md:p-24">
                <article className="prose lg:prose-xl dark:prose-invert max-w-5xl">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </article>
            </main>
        </>
    );
}