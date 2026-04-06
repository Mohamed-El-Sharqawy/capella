"use client";

import type { ReactNode } from "react";

interface AccountLayoutProps {
  greeting: string;
  sidebar: ReactNode;
  children: ReactNode;
}

export function AccountLayout({ greeting, sidebar, children }: AccountLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{greeting}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-4 sticky top-20">
            {sidebar}
          </div>
        </div>

        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
