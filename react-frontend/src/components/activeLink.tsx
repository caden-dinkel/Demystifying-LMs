"use client"; // This component must be a Client Component

import { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import navbar from "@/styles/navBar.module.css";
import { usePathname } from "next/navigation";

interface ActiveLinkProps {
  href: Url;
  children: React.ReactNode;
}

export function ActiveLink(linkProps: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === linkProps.href;

  return (
    <Link href={linkProps.href} className={navbar.navLink}>
      {linkProps.children}
    </Link>
  );
}
