import type { Metadata } from "next";
import "../client/src/index.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Christ's Loving Hands | Loads of Love",
  description:
    "Schedule Loads of Love laundry appointments with Christ's Loving Hands.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
