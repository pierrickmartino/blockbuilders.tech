/**
 * @fileoverview Root layout configuring global providers and metadata.
 */

import "./globals.css";
import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

import { SupabaseProvider } from "@/components/providers/supabase-provider";

/**
 * Application-wide metadata used for SEO and sharing.
 */
export const metadata: Metadata = {
  title: "BlockBuilders",
  description: "Strategy building made simple."
};

type RootLayoutProps = {
  children: ReactNode;
};

/**
 * Wraps the application with Supabase context and base document structure.
 *
 * @param {RootLayoutProps} props - Layout composition props.
 * @returns {ReactElement} Root HTML structure.
 */
export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
