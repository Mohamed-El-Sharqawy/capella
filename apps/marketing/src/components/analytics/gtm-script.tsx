"use client";

import Script from "next/script";
import { isGtmEnabled } from "@/lib/gtm";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const SGTM_URL = process.env.NEXT_PUBLIC_SGTM_URL;

/**
 * Loads the client GTM container and bootstraps the dataLayer.
 *
 * Order matters: dataLayer init -> Consent Mode v2 defaults (ALL GRANTED,
 * UAE-only, no banner) -> sGTM transport_url -> gtm.js. The consent default
 * must be set before the container loads so no tag fires in an "unknown" state.
 *
 * Dormant while NEXT_PUBLIC_TRACKING_MODE === "legacy" (returns null).
 */
export function GtmScript() {
  if (!GTM_ID || !isGtmEnabled()) {
    return null;
  }

  const serverUrlLine = SGTM_URL ? `gtag('set','server_url','${SGTM_URL}');` : "";

  return (
    <Script
      id="gtm-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent','default',{
            'ad_storage':'granted',
            'ad_user_data':'granted',
            'ad_personalization':'granted',
            'analytics_storage':'granted',
            'functionality_storage':'granted',
            'security_storage':'granted',
            'wait_for_update':500
          });
          ${serverUrlLine}
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `,
      }}
    />
  );
}
