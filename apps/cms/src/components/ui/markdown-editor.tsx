import { useRef, useCallback, useEffect, useState } from "react";
import { Bold, Italic, Heading2, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: string;
  className?: string;
}

type FormatCommand = "bold" | "italic" | "h2" | "ul" | "ol";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  dir,
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML === value) return;
    el.innerHTML = value;
  }, [value]);

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    const block = document.queryCommandValue("formatBlock");
    if (block.toLowerCase() === "h2") formats.add("h2");
    setActiveFormats(formats);
  }, []);

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    onChange(html);
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  const applyFormat = useCallback(
    (command: FormatCommand) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();

      switch (command) {
        case "bold":
          document.execCommand("bold");
          break;
        case "italic":
          document.execCommand("italic");
          break;
        case "h2": {
          const current = document.queryCommandValue("formatBlock");
          if (current.toLowerCase() === "h2") {
            document.execCommand("formatBlock", false, "p");
          } else {
            document.execCommand("formatBlock", false, "h2");
          }
          break;
        }
        case "ul":
          document.execCommand("insertUnorderedList");
          break;
        case "ol":
          document.execCommand("insertOrderedList");
          break;
      }

      handleInput();
    },
    [handleInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        applyFormat("bold");
      }
      if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        applyFormat("italic");
      }
    },
    [applyFormat]
  );

  const toolbarButtons: {
    command: FormatCommand;
    icon: typeof Bold;
    label: string;
  }[] = [
    { command: "bold", icon: Bold, label: "Bold (Ctrl+B)" },
    { command: "italic", icon: Italic, label: "Italic (Ctrl+I)" },
    { command: "h2", icon: Heading2, label: "Heading" },
    { command: "ul", icon: List, label: "Bullet List" },
    { command: "ol", icon: ListOrdered, label: "Numbered List" },
  ];

  const isEmpty =
    !editorRef.current?.textContent?.trim() &&
    !value?.replace(/<[^>]*>/g, "").trim();

  return (
    <div className={cn("rounded-md border bg-background shadow-xs", className)}>
      <div className="flex items-center gap-0.5 border-b px-2 py-1.5">
        {toolbarButtons.map(({ command, icon: Icon, label }) => (
          <button
            key={command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat(command)}
            className={cn(
              "p-1.5 rounded transition-colors",
              activeFormats.has(command)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="relative">
        {isEmpty && (
          <div
            className="absolute top-0 left-0 px-3 py-2 text-sm text-muted-foreground pointer-events-none"
            dir={dir}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir={dir}
          onInput={handleInput}
          onMouseUp={updateActiveFormats}
          onKeyUp={updateActiveFormats}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 text-sm outline-none min-h-[120px] prose prose-sm max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1"
        />
      </div>
    </div>
  );
}
