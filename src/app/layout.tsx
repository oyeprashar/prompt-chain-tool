import type { Metadata } from "next";
import { ThemeSwitcher } from "@/components/theme-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Chain Tool",
  description: "Create and manage multi-step AI prompt chains",
};

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem("prompt-chain-theme");
    const theme = saved === "light" || saved === "dark" ? saved : "system";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.resolvedTheme =
      theme === "system"
        ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
  } catch { document.documentElement.dataset.resolvedTheme = "dark"; }
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30">
        {children}
        <ThemeSwitcher />
      </body>
    </html>
  );
}
