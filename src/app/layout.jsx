import "antd-mobile/bundle/style.css";
import "./globals.css";

export const metadata = {
  title: "小账本",
  description: "简单、清晰的个人记账工具",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
