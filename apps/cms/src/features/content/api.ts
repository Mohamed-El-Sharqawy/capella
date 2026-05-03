import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShoppableVideos,
  getShoppableVideo,
  createShoppableVideo,
  updateShoppableVideo,
  updateShoppableVideoWithFiles,
  deleteShoppableVideo,
  reorderShoppableVideos,
  getInstagramPosts,
  getInstagramPost,
  createInstagramPost,
  updateInstagramPost,
  deleteInstagramPost,
  reorderInstagramPosts,
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  getPromoBanners,
  getPromoBanner,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  reorderPromoBanners,
} from "./mutations";

// Query keys
export const shoppableVideoKeys = {
  all: ["shoppableVideos"] as const,
  list: () => [...shoppableVideoKeys.all, "list"] as const,
  detail: (id: string) => [...shoppableVideoKeys.all, "detail", id] as const,
};

export const instagramPostKeys = {
  all: ["instagramPosts"] as const,
  list: () => [...instagramPostKeys.all, "list"] as const,
  detail: (id: string) => [...instagramPostKeys.all, "detail", id] as const,
};

// Shoppable Video hooks
export function useShoppableVideos() {
  return useQuery({
    queryKey: shoppableVideoKeys.list(),
    queryFn: getShoppableVideos,
  });
}

export function useShoppableVideo(id: string) {
  return useQuery({
    queryKey: shoppableVideoKeys.detail(id),
    queryFn: () => getShoppableVideo(id),
    enabled: !!id,
  });
}

export function useCreateShoppableVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShoppableVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppableVideoKeys.all });
    },
  });
}

export function useUpdateShoppableVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateShoppableVideo>[1] }) =>
      updateShoppableVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppableVideoKeys.all });
    },
  });
}

export function useUpdateShoppableVideoWithFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateShoppableVideoWithFiles>[1] }) =>
      updateShoppableVideoWithFiles(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppableVideoKeys.all });
    },
  });
}

export function useDeleteShoppableVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShoppableVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppableVideoKeys.all });
    },
  });
}

export function useReorderShoppableVideos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderShoppableVideos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppableVideoKeys.all });
    },
  });
}

// Instagram Post hooks
export function useInstagramPosts() {
  return useQuery({
    queryKey: instagramPostKeys.list(),
    queryFn: getInstagramPosts,
  });
}

export function useInstagramPost(id: string) {
  return useQuery({
    queryKey: instagramPostKeys.detail(id),
    queryFn: () => getInstagramPost(id),
    enabled: !!id,
  });
}

export function useCreateInstagramPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInstagramPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramPostKeys.all });
    },
  });
}

export function useUpdateInstagramPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateInstagramPost>[1] }) =>
      updateInstagramPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramPostKeys.all });
    },
  });
}

export function useDeleteInstagramPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInstagramPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramPostKeys.all });
    },
  });
}

export function useReorderInstagramPosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderInstagramPosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramPostKeys.all });
    },
  });
}

// Banner query keys
export const bannerKeys = {
  all: ["banners"] as const,
  list: () => [...bannerKeys.all, "list"] as const,
  detail: (id: string) => [...bannerKeys.all, "detail", id] as const,
};

// Banner hooks
export function useBanners() {
  return useQuery({
    queryKey: bannerKeys.list(),
    queryFn: getBanners,
  });
}

export function useBanner(id: string) {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => getBanner(id),
    enabled: !!id,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBanner>[1] }) =>
      updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
}

export function useReorderBanners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderBanners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
}

// Promo Banner query keys
export const promoBannerKeys = {
  all: ["promoBanners"] as const,
  list: () => [...promoBannerKeys.all, "list"] as const,
  detail: (id: string) => [...promoBannerKeys.all, "detail", id] as const,
};

// Promo Banner hooks
export function usePromoBanners() {
  return useQuery({
    queryKey: promoBannerKeys.list(),
    queryFn: getPromoBanners,
  });
}

export function usePromoBanner(id: string) {
  return useQuery({
    queryKey: promoBannerKeys.detail(id),
    queryFn: () => getPromoBanner(id),
    enabled: !!id,
  });
}

export function useCreatePromoBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPromoBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoBannerKeys.all });
    },
  });
}

export function useUpdatePromoBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePromoBanner>[1] }) =>
      updatePromoBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoBannerKeys.all });
    },
  });
}

export function useDeletePromoBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePromoBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoBannerKeys.all });
    },
  });
}

export function useReorderPromoBanners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderPromoBanners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoBannerKeys.all });
    },
  });
}
