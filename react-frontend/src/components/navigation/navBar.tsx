"use client";
import React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { SettingsPopover } from "../settings/settingsPopover";
import { cn } from "@/lib/utils";

// Define the structure for a simple navigation link
interface NavLink {
  name: string;
  href: string;
}

// Define the structure for a main navigation item, which can optionally have subOptions
interface NavItem extends NavLink {
  subOptions?: NavLink[];
}

// Data for sub-links
const WorkNavLinks: NavLink[] = [
  { name: "Tokenizing Text", href: "/lms_work/encode_tokens" },
  { name: "Predicting Next Word", href: "/lms_work/predict_next" },
  { name: "Searching for Words", href: "/lms_work/decode_tokens" },
  { name: "Sequential Generation", href: "/lms_work/sequential_generation" },
  {
    name: "Sequential Generation (d3)",
    href: "/lms_work/sequential_generation_d3",
  },
  { name: "Algorithm Search Tree", href: "/lms_work/algo_search" },
  { name: "Algorithm Search Tree (d3)", href: "/lms_work/algo_search_d3" },
];

const UsedNavLinks: NavLink[] = [
  { name: "Getting Better Answers", href: "/lms_used/lm_prompt_engineering" },
  { name: "Acting as a Planner", href: "/lms_used/lm_planning" },
  { name: "Smart Home Planner", href: "/lms_used/smart_home_planner" },
  { name: "Playing Chess", href: "/lms_used/lm_chess" },
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <NavigationMenu>
          <NavigationMenuList>
            {NavItems.map((link) => {
              if (link.subOptions && link.subOptions.length > 0) {
                return (
                  <NavigationMenuItem key={link.name}>
                    <NavigationMenuTrigger>{link.name}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {link.subOptions.map((subLink) => (
                          <ListItem
                            key={subLink.name}
                            title={subLink.name}
                            href={subLink.href}
                          />
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              } else {
                return (
                  <NavigationMenuItem key={link.name}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={link.href}
                        className={navigationMenuTriggerStyle()}
                      >
                        {link.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              }
            })}
          </NavigationMenuList>
        </NavigationMenu>
        <SettingsPopover />
      </div>
    </nav>
  );
};

const ListItem = React.forwardRef<
  React.ComponentRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href || "#"}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default Navbar;
