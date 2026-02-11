import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "LAif - AI-Powered Lifestyle App",
    description: "Improve your physical and mental health with AI-powered personalized suggestions",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
