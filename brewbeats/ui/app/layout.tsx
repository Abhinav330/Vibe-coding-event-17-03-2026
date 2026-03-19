import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";
import "../src/App.css";

export const metadata: Metadata = {
  title: "BrewBeats",
  description: "Pair tracks and playlists with drinks based on vibe",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
