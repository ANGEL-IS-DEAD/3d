// Root layout — loads the Google fonts, global CSS and SEO metadata, and wraps every
// page in the Lenis smooth-scroll provider.
//
// The metadata values come from `brand` / `seo` in site.config.ts. To change the
// *fonts*, swap the three next/font/google imports below and update the matching
// --font-* variables in app/globals.css.
import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Parisienne } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";
import { brand, seo } from "@/site.config";

// next/font/google downloads and serves fonts locally — works offline and in headless
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-parisienne",
  display: "swap",
});

const pageTitle = `${brand.name} — ${brand.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(seo.url),
  title: pageTitle,
  description: seo.description,
  keywords: [...seo.keywords],
  applicationName: brand.name,
  openGraph: {
    title: pageTitle,
    description: seo.description,
    url: seo.url,
    siteName: brand.name,
    locale: "en_US",
    type: "website",
    images: [{ url: seo.ogImage, alt: seo.ogImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: seo.description,
    images: [seo.ogImage],
  },
  robots: { index: seo.indexable, follow: seo.indexable },
};

export const viewport: Viewport = {
  themeColor: seo.themeColor,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${parisienne.variable}`}
    >
      <body>
        {/* DEBUG (dormant): ES5-safe inline reporter — runs WITHOUT React, catches
            failed chunk loads / syntax errors / runtime errors directly on screen.
            Useful for diagnosing a black/blank page on a real device (esp. when React
            isn't hydrating). Uncomment the <script> below to re-enable. */}
        {/*
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var d=document.createElement('div');
  d.style.cssText='position:fixed;bottom:8px;left:8px;right:8px;z-index:2147483647;background:#000;color:#ff0;font:12px monospace;padding:10px;max-height:50vh;overflow:auto;white-space:pre-wrap;border:2px solid #ff0';
  d.textContent='BOOT: inline JS ran (no React needed)';
  var add=function(m){d.textContent+='\\n'+m;};
  window.addEventListener('error',function(e){
    if(e&&e.target&&(e.target.src||e.target.href)){add('RES FAIL: '+String(e.target.src||e.target.href).slice(-70));}
    else{add('ERR: '+(e.message||'')+' @'+String(e.filename||'').slice(-46)+':'+(e.lineno||''));}
  },true);
  window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;add('REJECT: '+(r&&r.message?r.message:String(r)).slice(0,120));});
  var mount=function(){try{if(document.documentElement&&d.parentNode!==document.documentElement){document.documentElement.appendChild(d);}}catch(e){}};
  mount();
  setInterval(mount,700);
  window.addEventListener('load',function(){add('window load fired');});
}catch(err){}})();`,
          }}
        />
        */}
        <LenisProvider>
{children}
        </LenisProvider>
      </body>
    </html>
  );
}
