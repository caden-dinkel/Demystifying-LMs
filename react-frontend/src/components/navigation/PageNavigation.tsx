"use client";

import React from "react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PageNavigationProps {
  previousPage?: {
    href: string;
    label: string;
  };
  nextPage?: {
    href: string;
    label: string;
  };
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  previousPage,
  nextPage,
}) => {
  if (!previousPage && !nextPage) {
    return null;
  }

  return (
    <div className="mt-12 mb-8">
      <Pagination>
        <PaginationContent>
          {previousPage && (
            <PaginationItem>
              <Link href={previousPage.href} passHref legacyBehavior>
                <PaginationPrevious>
                  <span className="sr-only">Previous: </span>
                  {previousPage.label}
                </PaginationPrevious>
              </Link>
            </PaginationItem>
          )}
          {nextPage && (
            <PaginationItem>
              <Link href={nextPage.href} passHref legacyBehavior>
                <PaginationNext>
                  <span className="sr-only">Next: </span>
                  {nextPage.label}
                </PaginationNext>
              </Link>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};
