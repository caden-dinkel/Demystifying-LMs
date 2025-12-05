"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
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
              <PaginationPrevious href={previousPage.href}>
                <span className="sr-only">Previous: </span>
                {previousPage.label}
              </PaginationPrevious>
            </PaginationItem>
          )}
          {nextPage && (
            <PaginationItem>
              <PaginationNext href={nextPage.href}>
                <span className="sr-only">Next: </span>
                {nextPage.label}
              </PaginationNext>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};
