import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/styles/globals.css";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/brand";
import { LanguageProvider } from "@/i18n";
import { GoogleTagManagerNoscript } from "@/components/GoogleTagManagerNoscript";
import { GoogleAnalyticsScript } from "@/components/GoogleAnalyticsScript";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) - initialisation dans le head comme recommandé par Google */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              // La configuration sera faite côté client selon le consentement
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={geist.className}>
        <GoogleTagManagerNoscript />
        <GoogleAnalyticsScript />
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
