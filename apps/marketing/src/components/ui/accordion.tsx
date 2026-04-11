"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  allowMultiple?: boolean;
}

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AccordionItem({ title, children, isOpen, onToggle, className = "" }: AccordionItemProps) {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const isControlled = isOpen !== undefined;
  const active = isControlled ? isOpen : internalIsOpen;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={`border-b border-gray-100 last:border-b-0 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={active}
        className="flex w-full items-center justify-between py-6 text-left transition-all group"
      >
        <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.25em] text-gray-900 group-hover:text-black transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-500 ease-in-out ${active ? "rotate-180 text-black" : ""
            }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: active ? `${contentRef.current?.scrollHeight}px` : "0px",
          opacity: active ? 1 : 0,
          visibility: active ? "visible" : "hidden",
        }}
      >
        <div ref={contentRef} className="pt-2 pb-8 text-[11px] md:text-xs leading-relaxed text-gray-500 font-light tracking-wide space-y-4 pr-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Accordion({ children, className = "", allowMultiple = false }: AccordionProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (allowMultiple) {
    return <div className={`divide-y divide-gray-100 ${className}`}>{children}</div>;
  }

  return (
    <div className={`divide-y divide-gray-100 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<AccordionItemProps>(child)) {
          return React.cloneElement(child, {
            isOpen: activeIndex === index,
            onToggle: () => setActiveIndex(activeIndex === index ? null : index),
          });
        }
        return child;
      })}
    </div>
  );
}
