"use client";

const WHATSAPP_NUMBER = "971524514147";
const WHATSAPP_MESSAGE = "Hello Capella!";

export function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.132 6.742 3.052 9.378L1.056 31.2l6.066-1.95A15.9 15.9 0 0016.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0zm9.302 22.61c-.39 1.1-1.932 2.014-3.164 2.28-.842.18-1.942.324-5.646-1.214-4.742-1.966-7.796-6.778-8.032-7.094-.228-.316-1.858-2.476-1.858-4.724s1.178-3.354 1.594-3.812c.39-.428.854-.536 1.14-.536.286 0 .572.004.82.014.264.012.618-.1.966.738.364.872 1.236 3.024 1.344 3.244.108.22.18.478.036.77-.144.296-.216.478-.432.738-.216.258-.454.578-.648.774-.216.22-.44.458-.19.898.252.44 1.118 1.844 2.398 2.988 1.648 1.472 3.038 1.928 3.472 2.144.432.216.684.18.936-.108.252-.29 1.082-1.26 1.37-1.694.288-.432.576-.36.968-.216.394.144 2.498 1.178 2.926 1.394.428.216.714.324.82.504.108.18.108 1.038-.282 2.136z" />
      </svg>
    </a>
  );
}
