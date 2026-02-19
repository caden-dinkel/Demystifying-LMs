"use client";

import Navbar from "@/components/navigation/navBar";
import React from "react";
import { StepTokenGen } from "@/components/search_tokens/stepGeneration";
import styles from "@/styles/main-layout.module.css";
import { PageNavigation } from "@/components/navigation/PageNavigation";

export default function TokenizeText() {
  return (
    <>
      {/* 1. Navbar (Navigation, outside the main content) */}
      <Navbar />

      {/* 2. Main Content (The unique part of this page) */}
      <main className={styles.baseMain}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            How Language Models Work
          </h1>
          <article className="prose lg:prose-lg dark:prose-invert max-w-7xl mb-6">
            <p>
              When you give a language model a prompt, it doesn&apos;t just
              &apos;think&apos; of an answer. Instead it follows a well-defined
              &apos;generation pipeline&apos; to build its response one piece at
              a time.
            </p>
            <p>
              This process involves two main stages. First, the model has to
              break down your prompt and its own working response into numbers
              it can understand. This is the process of generating tokens.
              Second, it has to algorithmically decide which tokens to bring
              together to create meaningful and cohering sentences, this is done
              by searching tokens. This section breaks down both of those steps.
            </p>
          </article>
        </div>
        <StepTokenGen />
        <PageNavigation
          nextPage={{
            href: "/lms_work/encode_tokens",
            label: "Tokenizing Text",
          }}
        />
      </main>
    </>
  );
}
