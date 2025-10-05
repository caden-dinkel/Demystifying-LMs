"use client";

import Navbar from "@/components/navBar";
import React, { useState } from "react";
import { Tokenizer } from "@/components/tokenizeText";

export default function TokenizeText() {
  return (
    <div>
      <Navbar />
      <Tokenizer />
    </div>
  );
}
