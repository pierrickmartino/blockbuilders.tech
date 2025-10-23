import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SupabaseProvider } from "@/components/providers/supabase-provider";

export const metadata: Metadata = {
  title: "BlockBuilders",
  description: "Strategy building made simple."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
