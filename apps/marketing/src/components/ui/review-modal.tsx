"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Star, ShoppingBag, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { createCartItemFromVariant } from "@/lib/cart";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { apiGet, apiPost } from "@/lib/api-client";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  locale: string;
  onReviewSubmitted?: () => void;
}

type ModalState = "loading" | "auth" | "not-purchased" | "review";

export function ReviewModal({ isOpen, onClose, product, locale, onReviewSubmitted }: ReviewModalProps) {
  const { user, isAuthenticated, isLoading: authLoading, signIn, signUp, getAccessToken } = useAuth();
  const { addItem } = useCart();
  const isArabic = locale === "ar";

  const [modalState, setModalState] = useState<ModalState>("loading");
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const name = isArabic ? product.nameAr : product.nameEn;
  const productImage = product.variants?.[0]?.images?.[0]?.url;

  // Check purchase status when authenticated
  useEffect(() => {
    if (!isOpen) return;

    if (authLoading) {
      setModalState("loading");
      return;
    }

    if (!isAuthenticated) {
      setModalState("auth");
      return;
    }

    // Check if user has purchased this product
    const checkPurchase = async () => {
      setIsCheckingPurchase(true);
      try {
        const token = getAccessToken();
        const response = await apiGet<{ data: { data: any[] } }>("/api/orders", { token: token || undefined });
        const orders = response.data?.data || [];
        
        // Get all variant IDs for this product
        const productVariantIds = product.variants?.map((v) => v.id) || [];
        
        // Check if any order contains a variant of this product
        const hasPurchased = orders.some((order: any) =>
          order.items?.some((item: any) => productVariantIds.includes(item.variantId))
        );

        setModalState(hasPurchased ? "review" : "not-purchased");
      } catch {
        setModalState("not-purchased");
      } finally {
        setIsCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [isOpen, authLoading, isAuthenticated, product.id, getAccessToken]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      let result;
      if (authMode === "signin") {
        result = await signIn(email, password);
      } else {
        result = await signUp({ email, password, firstName, lastName });
      }

      if (!result.success) {
        setAuthError(result.error || "Authentication failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    const variant = product.variants?.[0];
    if (!variant) return;

    const cartItem = createCartItemFromVariant(variant, {
      id: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
    });
    addItem(cartItem);
    onClose();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    setAuthError("");

    try {
      const token = getAccessToken();
      const response = await apiPost(
        "/api/reviews",
        {
          productId: product.id,
          rating,
          title: reviewTitle,
          content: reviewContent,
        },
        { token: token || undefined }
      );

      // Check if response has error (409 for duplicate review)
      if (response && typeof response === 'object' && 'error' in response) {
        setAuthError(response.error as string);
        setIsSubmittingReview(false);
        return;
      }

      setReviewSuccess(true);
      
      // Invalidate reviews cache to refetch
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      setTimeout(() => {
        onClose();
        setReviewSuccess(false);
        setRating(5);
        setReviewTitle("");
        setReviewContent("");
        setAuthError("");
      }, 2000);
    } catch (error) {
      setAuthError(isArabic ? "حدث خطأ أثناء إرسال المراجعة" : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {modalState === "auth"
                ? isArabic ? "تسجيل الدخول" : "Sign In"
                : modalState === "not-purchased"
                ? isArabic ? "اكتب مراجعة" : "Write a Review"
                : isArabic ? "اكتب مراجعة" : "Write a Review"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading State */}
            {(modalState === "loading" || isCheckingPurchase) && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {isArabic ? "جاري التحميل..." : "Loading..."}
                </p>
              </div>
            )}

            {/* Auth State */}
            {modalState === "auth" && !isCheckingPurchase && (
              <div className="space-y-6">
                {/* Product Preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden relative shrink-0">
                    {productImage && (
                      <Image
                        src={productImage}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isArabic
                        ? "سجل دخولك لكتابة مراجعة"
                        : "Sign in to write a review"}
                    </p>
                  </div>
                </div>

                {/* Auth Tabs */}
                <div className="flex border-b">
                  <button
                    onClick={() => setAuthMode("signin")}
                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition ${
                      authMode === "signin"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <LogIn className="h-4 w-4 inline mr-2" />
                    {isArabic ? "تسجيل الدخول" : "Sign In"}
                  </button>
                  <button
                    onClick={() => setAuthMode("signup")}
                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition ${
                      authMode === "signup"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <UserPlus className="h-4 w-4 inline mr-2" />
                    {isArabic ? "إنشاء حساب" : "Sign Up"}
                  </button>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === "signup" && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder={isArabic ? "الاسم الأول" : "First Name"}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="text"
                        placeholder={isArabic ? "الاسم الأخير" : "Last Name"}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  )}
                  <input
                    type="email"
                    placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    type="password"
                    placeholder={isArabic ? "كلمة المرور" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />

                  {authError && (
                    <p className="text-sm text-red-600">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : authMode === "signin" ? (
                      isArabic ? "تسجيل الدخول" : "Sign In"
                    ) : (
                      isArabic ? "إنشاء حساب" : "Create Account"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Not Purchased State */}
            {modalState === "not-purchased" && !isCheckingPurchase && (
              <div className="text-center space-y-6">
                {/* Product Preview */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden relative mb-4">
                    {productImage && (
                      <Image
                        src={productImage}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    )}
                  </div>
                  <h3 className="font-medium">{name}</h3>
                </div>

                {/* Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm">
                    {isArabic
                      ? "لا يمكنك كتابة مراجعة لمنتج لم تشتريه بعد"
                      : "You can only review products you've purchased"}
                  </p>
                </div>

                {/* Suggestion */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? "هل تريد شراء هذا المنتج؟"
                      : "Would you like to buy this product?"}
                  </p>
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {isArabic ? "أضف إلى السلة" : "Add to Cart"}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    {isArabic ? "ربما لاحقاً" : "Maybe Later"}
                  </button>
                </div>
              </div>
            )}

            {/* Review Form State */}
            {modalState === "review" && !isCheckingPurchase && (
              <div className="space-y-6">
                {reviewSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-green-600 fill-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg">
                      {isArabic ? "شكراً لك!" : "Thank You!"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isArabic
                        ? "تم إرسال مراجعتك بنجاح"
                        : "Your review has been submitted successfully"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Product Preview */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden relative shrink-0">
                        {productImage && (
                          <Image
                            src={productImage}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isArabic
                            ? `مرحباً ${user?.firstName}، شاركنا رأيك`
                            : `Hi ${user?.firstName}, share your thoughts`}
                        </p>
                      </div>
                    </div>

                    {/* Review Form */}
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? "التقييم" : "Rating"}
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Title */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? "عنوان المراجعة" : "Review Title"}
                        </label>
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder={
                            isArabic
                              ? "اكتب عنوان مختصر..."
                              : "Write a brief title..."
                          }
                          required
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      {/* Review Content */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? "مراجعتك" : "Your Review"}
                        </label>
                        <textarea
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          placeholder={
                            isArabic
                              ? "شاركنا تجربتك مع هذا المنتج..."
                              : "Share your experience with this product..."
                          }
                          rows={4}
                          required
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                      </div>

                      {authError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">{authError}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                      >
                        {isSubmittingReview ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          isArabic ? "إرسال المراجعة" : "Submit Review"
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
