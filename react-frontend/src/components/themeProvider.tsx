"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

type NextThemesProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({
  children,
  ...props
}: React.PropsWithChildren<NextThemesProps>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
