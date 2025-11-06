"use client"; // This component must be a Client Component

import { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import navbar from "@/styles/navBar.module.css";
import * as React from "react";
interface ActiveLinkProps {
  href: Url;
  children: React.ReactNode;
  dropDownContent?: React.ReactNode;
}

export function ActiveLink(linkProps: ActiveLinkProps) {
  const [isActive, setIsActive] = React.useState(false);
  const hasDropdown = linkProps.dropDownContent && isActive;
  return (
    <div
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      className="relative inline-block"
    >
      <Link
        href={linkProps.href}
        className={hasDropdown ? navbar.activeLink : navbar.navLink}
      >
        {linkProps.children}
        <span
          style={{
            transform: hasDropdown ? "scaleX(1)" : "scaleX(0)",
          }}
          className={navbar.navLinkIndicator}
        />
      </Link>
      {hasDropdown && linkProps.dropDownContent}
    </div>
  );
}
