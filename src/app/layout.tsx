import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "حاسبات الموارد البشرية",
  description: "نظام حاسبات الموارد البشرية - صرف مستحقات الإجازة، حاسبة الإجازة المستحقة، حاسبة نهاية الخدمة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

