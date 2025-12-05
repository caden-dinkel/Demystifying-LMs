"use client";

import Navbar from "@/components/navigation/navBar";
import styles from "@/styles/main-layout.module.css";

export default function SequentialGeneration() {
  return (
    <div>
      <Navbar />
      <main className={styles.baseMain}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Sequential Generation
          </h1>
          <p className="text-muted-foreground mb-4">
            Future implementation: This page will demonstrate sequential text
            generation, showing how language models build outputs token by token
            in sequence.
          </p>
          <div className="p-6 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground italic">
              🚧 Coming soon: Interactive sequential generation visualization
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
