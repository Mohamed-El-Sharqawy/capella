"use client";

import { Link } from "@/i18n/navigation";

interface AuthFooterProps {
  question: string;
  linkText: string;
  linkHref: string;
  guestText: string;
  guestHref: string;
}

export function AuthFooter({ question, linkText, linkHref, guestText, guestHref }: AuthFooterProps) {
  return (
    <>
      <p className="text-center text-sm">
        {question}{" "}
        <Link href={linkHref} className="font-medium text-black hover:underline">
          {linkText}
        </Link>
      </p>

      <div className="mt-4 text-center">
        <Link href={guestHref} className="text-sm text-muted-foreground hover:text-foreground">
          {guestText}
        </Link>
      </div>
    </>
  );
}
