"use client";

import Navbar from "@/components/navBar";
import React from "react";
import { TextGenerator } from "@/components/textGen";

export default function GenerateText() {
  return (
    <div>
      <Navbar />
      <TextGenerator />
    </div>
  );
}
