// Add this line at the very top. It tells Next.js to run this code in the browser.
"use client";

//This is to change gits
import Navbar from "@/components/navBar";
import React, { useState } from "react";

export default function Home() {
  return (
    <div>
      <Navbar />
    </div>
  );
}
