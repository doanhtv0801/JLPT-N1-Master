"use client";

import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";
import { StoreHydration } from "./store-hydration";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchCommand } from "@/components/features/search-command";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <StoreHydration />
        {children}
        <SearchCommand />
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}
