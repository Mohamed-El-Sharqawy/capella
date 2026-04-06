"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Language {
  code: string;
  name: string;
  flagUrl: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English", flagUrl: "https://flagcdn.com/w40/us.png" },
  { code: "ar", name: "العربية", flagUrl: "https://flagcdn.com/w40/eg.png" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: langCode });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 transition"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="hidden sm:inline text-xs font-medium">{currentLanguage.code.toUpperCase()}</span>
        <Image 
          src={currentLanguage.flagUrl} 
          alt={currentLanguage.name}
          width={30}
          height={25}
          className="rounded-sm"
        />
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={cn("absolute mt-1 w-36 bg-white border rounded-lg shadow-lg py-1 z-50", locale === "ar" ? "left-0": "right-0")}
          role="listbox"
          aria-label="Select language"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition ${
                lang.code === locale ? "bg-gray-50 font-medium" : ""
              }`}
              role="option"
              aria-selected={lang.code === locale}
            >
              <Image 
                src={lang.flagUrl} 
                alt={lang.name}
                width={30}
                height={25}
                className="rounded-sm"
              />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
