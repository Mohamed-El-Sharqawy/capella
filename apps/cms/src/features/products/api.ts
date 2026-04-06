import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, fetchProduct } from "./queries";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  uploadVariantImages,
  deleteVariantImage,
  uploadSizeGuide,
  deleteSizeGuide,
  uploadProductImages,
  getProductImages,
  deleteProductImage,
  linkImageToVariant,
  linkImageToVariants,
  unlinkImageFromVariant,
  type CreateProductBody,
  type UpdateProductBody,
  type CreateVariantBody,
  type UpdateVariantBody,
} from "./mutations";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: Record<string, string>) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
};

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateProductBody) => createProduct(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProductBody }) =>
      updateProduct(id, body),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useCreateVariant() {
  return useMutation({
    mutationFn: ({ productId, body }: { productId: string; body: CreateVariantBody }) =>
      createVariant(productId, body),
  });
}

export function useUpdateVariant() {
  return useMutation({
    mutationFn: ({ variantId, body }: { variantId: string; body: UpdateVariantBody }) =>
      updateVariant(variantId, body),
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUploadVariantImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantId,
      files,
      altEn,
      altAr,
    }: {
      variantId: string;
      files: File[];
      altEn?: string;
      altAr?: string;
    }) => uploadVariantImages(variantId, files, altEn, altAr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteVariantImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteVariantImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUploadSizeGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      uploadSizeGuide(productId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteSizeGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteSizeGuide(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

// Product Images hooks
export const productImageKeys = {
  all: ["productImages"] as const,
  list: (productId: string) => [...productImageKeys.all, productId] as const,
};

export function useProductImages(productId: string) {
  return useQuery({
    queryKey: productImageKeys.list(productId),
    queryFn: () => getProductImages(productId),
    enabled: !!productId,
  });
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      files,
      altEn,
      altAr,
    }: {
      productId: string;
      files: File[];
      altEn?: string;
      altAr?: string;
    }) => uploadProductImages(productId, files, altEn, altAr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useLinkImageToVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      imageId,
      variantId,
      position,
    }: {
      imageId: string;
      variantId: string;
      position?: number;
    }) => linkImageToVariant(imageId, variantId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useLinkImageToVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, variantIds }: { imageId: string; variantIds: string[] }) =>
      linkImageToVariants(imageId, variantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUnlinkImageFromVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, variantId }: { imageId: string; variantId: string }) =>
      unlinkImageFromVariant(imageId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
