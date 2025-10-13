import React, { useState, useRef, useEffect } from "react";
import navbar from "@/styles/navBar.module.css";
import { ActiveLink } from "./activeLink";
import { Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/button";
import { Card, CardContent } from "@/components/card";
import { ThemeSwitch } from "./themeSwitch";

const NavLinks = [
  { name: "Home", href: "/" },
  { name: "Generate Text", href: "/generate_text" },
  { name: "Generate Tokens", href: "/generate_tokens" },
  { name: "Tokenize Text", href: "/tokenize_text" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dropdownRef = useRef(null);

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
      <div className={navbar.settingsDropdownContainer} ref={dropdownRef}>
        <Button
          variant="ghost" // Use a shadcn button style
          size="icon"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          aria-expanded={isSettingsOpen}
          aria-label="Settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
        {isSettingsOpen && (
          <Card className={navbar.settingsCard}>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                <ThemeSwitch></ThemeSwitch>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
