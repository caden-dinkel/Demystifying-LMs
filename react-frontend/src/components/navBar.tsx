import React, { useState } from "react";
import navbar from "@/styles/navBar.module.css";
import { ActiveLink } from "./activeLink";

const NavLinks = [
  { name: "Home", href: "/" },
  { name: "Generate Text", href: "/generate_text" },
  { name: "Generate Tokens", href: "/generate_tokens" },
  { name: "Tokenize Text", href: "/tokenize_text" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the menu open/closed

  return (
    <nav className={navbar.navbar}>
      {NavLinks.map((link) => (
        // Use the Next.js Link component with the 'href' prop
        <ActiveLink key={link.name} href={link.href}>
          {link.name}
        </ActiveLink>
      ))}
    </nav>
  );
};

export default Navbar;
