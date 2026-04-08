"use client";

import { Check } from "lucide-react";

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ id, label, checked, onChange, className = "" }: CheckboxProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-all duration-200 ${checked ? "bg-black border-black" : "bg-white border-gray-300 hover:border-black"
          }`}
      >
        <Check className={`h-3 w-3 text-white transition-opacity ${checked ? "opacity-100" : "opacity-0"}`} />
      </button>
      <label
        htmlFor={id}
        className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}
