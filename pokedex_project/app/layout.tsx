import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "포켓몬 도감",
  description: "포켓몬 정보를 검색하고 세대별로 탐색할 수 있는 도감입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
