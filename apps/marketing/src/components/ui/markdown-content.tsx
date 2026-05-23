interface RichTextContentProps {
  content: string;
  className?: string;
}

export function RichTextContent({ content, className }: RichTextContentProps) {
  if (!content) return null;

  const text = content.replace(/<[^>]*>/g, "").trim();
  if (!text) return null;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
