import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dee's Laundromat | Customer Portal",
  description: "Sign in or create an account with Dee's Laundromat to book laundry pickups and manage orders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
