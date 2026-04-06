"use client";

interface AuthDividerProps {
  text: string;
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-sm text-muted-foreground">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
