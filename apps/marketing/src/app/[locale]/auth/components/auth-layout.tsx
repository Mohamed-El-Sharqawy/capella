"use client";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 pt-32 md:pt-36">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
