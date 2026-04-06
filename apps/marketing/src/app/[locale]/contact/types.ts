export interface ContactPageClientProps {
  locale: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export type SubmitStatus = "idle" | "success" | "error";

export interface ContactInfoItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  href: string | null;
}

export interface SubjectOption {
  value: string;
  label: string;
}

export interface FaqItem {
  q: string;
  a: string;
}
