export interface CartPageClientProps {
  locale: string;
}

export interface CartItemDisplayProps {
  item: any;
  locale: string;
  onRemove: (variantId: string) => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
}

export interface OrderSummaryProps {
  total: number;
}

export interface SuggestedProductsProps {
  products: any[];
  locale: string;
  title: string;
}
