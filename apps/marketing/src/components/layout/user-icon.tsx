"use client";

import { User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";

export function UserIcon() {
  const { isAuthenticated } = useAuth();

  return (
    <Link
      href={isAuthenticated ? "/account" : "/auth/signin"}
      className="hidden sm:block p-2 hover:opacity-70 transition-opacity"
    >
      <User className="h-5 w-5" />
    </Link>
  );
}
