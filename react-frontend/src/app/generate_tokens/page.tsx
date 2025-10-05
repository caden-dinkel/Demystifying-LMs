// react-frontend/src/app/page.tsx
"use client";

import Navbar from "@/components/navBar";
import React, { useState } from "react";
import { StepTokenGen } from "@/components/stepGeneration";

export default function GenerateTokens() {
  return (
    <div>
      <Navbar />
      <StepTokenGen />
    </div>
  );
}
