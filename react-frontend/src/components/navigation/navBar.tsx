"use client";

import React, { useState } from "react"; // 1. Import useState
import navbar from "@/styles/navBar.module.css";
import { ActiveLink } from "./activeLink";
import { Card, CardContent } from "@/components/card"; // 1. Import Card components
import { SettingsCard } from "@/components/settings/settingsCard";

// Define the structure for a simple navigation link
interface NavLink {
  name: string;
  href: string;
}

// Define the structure for a main navigation item, which can optionally have subOptions
interface NavItem extends NavLink {
  subOptions?: NavLink[];
}

// Data for sub-links (kept from your original file)
const WorkNavLinks: NavLink[] = [
  { name: "Tokenizing Text", href: "/lms_work/tokenize_text" },
  { name: "Predicting Next Word", href: "/lms_work/predict_next" },
  { name: "Searching for Words", href: "/lms_work/search_token" },
  { name: "Sequential Generation", href: "/lms_work/sequential_generation" },
];

const UsedNavLinks: NavLink[] = [
  { name: "Getting Better Answers", href: "/lms_used/lm_prompt_engineering" },
  { name: "Acting as a Planner", href: "/lms_used/lm_planning" },
];

// Combined navigation items data structure
const NavItems: NavItem[] = [
  { name: "Home", href: "/" },
  {
    name: "How Language Models Work",
    href: "/lms_work",
    subOptions: WorkNavLinks,
  },
  {
    name: "How Language Models Are Used",
    href: "/lms_used",
    subOptions: UsedNavLinks,
  },
];

const Navbar = () => {
  return (
    <nav className={navbar.navbar}>
      <div className={navbar.navLinksContainer}>
        {/* 3. Revised Rendering Logic */}
        {NavItems.map((link) => {
          return (
            <ActiveLink
              href={link.href}
              key={link.name}
              children={link.name}
              dropDownContent={
                <Card className={navbar.settingsCard}>
                  <CardContent className="p-0 flex flex-col space-y-1">
                    {link.subOptions?.map((subLink) => (
                      <ActiveLink
                        key={subLink.name}
                        href={subLink.href}
                        // Add a block display, padding, and hover style for better clickability/UX
                      >
                        {subLink.name}
                      </ActiveLink>
                    ))}
                  </CardContent>
                </Card>
              }
            ></ActiveLink>
          );
        })}
      </div>
      <SettingsCard></SettingsCard>
    </nav>
  );
};

export default Navbar;
