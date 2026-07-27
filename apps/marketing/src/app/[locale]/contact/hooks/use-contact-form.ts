"use client";

import { useState, useCallback } from "react";
import type { ContactFormData, SubmitStatus } from "../types";
import { INITIAL_FORM_DATA } from "../constants";
import { fbLead } from "@/lib/facebook-pixel";
import { getFbp, getFbc } from "@/lib/meta-cookies";
import { capiHeaders } from "@/lib/capi-headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const leadEventId = typeof crypto !== "undefined" && crypto.randomUUID
        ? `lead_${crypto.randomUUID()}`
        : `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...capiHeaders() },
        body: JSON.stringify({ ...formData, eventId: leadEventId, fbp: getFbp(), fbc: getFbc() }),
        credentials: "include",
        referrerPolicy: "no-referrer-when-downgrade",
      });

      if (!res.ok) throw new Error("Failed");

      fbLead({ eventId: leadEventId });
      setSubmitStatus("success");
      setFormData(INITIAL_FORM_DATA);
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const resetStatus = useCallback(() => {
    setSubmitStatus("idle");
  }, []);

  return {
    formData,
    isSubmitting,
    submitStatus,
    handleChange,
    handleSubmit,
    resetStatus,
  };
}
