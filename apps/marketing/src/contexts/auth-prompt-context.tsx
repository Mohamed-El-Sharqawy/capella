"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Heart, LogIn, X } from "lucide-react";

interface AuthPromptContextType {
  showAuthPrompt: (feature?: string) => void;
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);
  if (context === undefined) {
    throw new Error("useAuthPrompt must be used within an AuthPromptProvider");
  }
  return context;
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("auth");
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState<string>("this feature");

  const showAuthPrompt = useCallback((featureName?: string) => {
    setFeature(featureName || "this feature");
    setIsOpen(true);
  }, []);

  const handleSignIn = () => {
    setIsOpen(false);
    router.push("/auth/signin");
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt }}>
      {children}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClose}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {t("signInRequired")}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("signInToUse", { feature })}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleSignIn} className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  {t("signIn")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full"
                >
                  {t("maybeLater")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthPromptContext.Provider>
  );
}
