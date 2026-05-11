"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  locale: string;
}

export function SizeGuideModal({ isOpen, onClose, imageUrl, locale }: SizeGuideModalProps) {
  const isArabic = locale === "ar";
  const t = useTranslations("product");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {t("sizeGuide")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="relative w-full">
              <Image
                src={imageUrl}
                alt={t("sizeGuide")}
                width={800}
                height={600}
                className="w-full h-auto object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
