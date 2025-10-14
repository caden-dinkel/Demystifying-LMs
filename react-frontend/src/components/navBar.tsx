import React, { useState, useRef } from "react";
import navbar from "@/styles/navBar.module.css";
import { ActiveLink } from "./activeLink";

import { SettingsCard } from "./settingsCard";

const NavLinks = [
  { name: "Home", href: "/" },
  { name: "Generate Text", href: "/generate_text" },
  { name: "Generate Tokens", href: "/generate_tokens" },
  { name: "Tokenize Text", href: "/tokenize_text" },
];

const Navbar = () => {
  return (
    <nav className={navbar.navbar}>
      <div className={navbar.navLinksContainer}>
        {NavLinks.map((link) => (
          // Use the Next.js Link component with the 'href' prop
          <ActiveLink key={link.name} href={link.href}>
            {link.name}
          </ActiveLink>
        ))}
      </div>
      <SettingsCard></SettingsCard>
    </nav>
  );
};

export default Navbar;
