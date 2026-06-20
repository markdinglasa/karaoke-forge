import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaraokeForge — Create Karaoke Videos Instantly",
  description:
    "Upload your MP3, background image, and lyrics. KaraokeForge automatically generates a professional karaoke video with synced lyrics.",
  keywords: ["karaoke", "video generator", "lyrics sync", "karaoke maker", "mp3 to video"],
  openGraph: {
    title: "KaraokeForge",
    description: "Create stunning karaoke videos in minutes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="animated-bg">
          <div className="animated-bg-orb3" />
        </div>
        <div className="page-wrapper">{children}</div>
      </body>
    </html>
  );
}
