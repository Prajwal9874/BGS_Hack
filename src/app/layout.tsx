import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "fluent.ly — Find your people. Find your words.",
  description:
    "Reciprocal language exchange, daily accountability, and personal language tutors. Made for Indian and global languages.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
