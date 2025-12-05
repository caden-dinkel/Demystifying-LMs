import Navbar from "@/components/navigation/navBar";
import React from "react";
import styles from "@/styles/main-layout.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import fs from "fs";
import path from "path";
import { PageNavigation } from "@/components/navigation/PageNavigation";

export default function BigData() {
  const mdFilePath = path.join(
    process.cwd(),
    "src",
    "app",
    "content",
    "big_data.md"
  );

  let content = "Error: big_data.md file not found.";

  try {
    content = fs.readFileSync(mdFilePath, "utf8");
  } catch (err) {
    console.error(err);
  }

  return (
    <>
      <Navbar />
      <main className={styles.baseMain}>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Big Data</h1>
        <article className="prose lg:prose-xl dark:prose-invert max-w-5xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
        <PageNavigation
          previousPage={{
            href: "/lms_trained",
            label: "How LMs Are Trained",
          }}
          nextPage={{
            href: "/lms_trained/supervised_finetuning",
            label: "Supervised Fine-tuning",
          }}
        />
      </main>
    </>
  );
}
