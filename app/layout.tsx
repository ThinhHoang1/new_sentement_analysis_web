export const metadata = {
  title: "News Sentiment Signal",
  description: "Analyze latest news sentiment for tickers/coins"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, Arial, sans-serif" }}>{children}</body>
    </html>
  );
}


