"use client";

import { LucideIcon } from "lucide-react";

interface FormInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function FormInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  icon: Icon,
  className = "",
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${className}`}
        />
      </div>
    </div>
  );
}
