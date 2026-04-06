import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCollections, fetchAllCollections, fetchCollection } from "./queries";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  uploadCollectionImage,
  deleteCollectionImage,
  type CreateCollectionBody,
  type UpdateCollectionBody,
} from "./mutations";

export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  list: () => [...collectionKeys.lists()] as const,
  listAll: () => [...collectionKeys.all, "listAll"] as const,
  details: () => [...collectionKeys.all, "detail"] as const,
  detail: (slug: string) => [...collectionKeys.details(), slug] as const,
};

export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: fetchCollections,
  });
}

export function useAllCollections() {
  return useQuery({
    queryKey: collectionKeys.listAll(),
    queryFn: fetchAllCollections,
  });
}

export function useCollection(slug: string) {
  return useQuery({
    queryKey: collectionKeys.detail(slug),
    queryFn: () => fetchCollection(slug),
    enabled: !!slug,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCollectionBody) => createCollection(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCollectionBody }) =>
      updateCollection(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useUploadCollectionImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      file,
      altEn,
      altAr,
    }: {
      collectionId: string;
      file: File;
      altEn?: string;
      altAr?: string;
    }) => uploadCollectionImage(collectionId, file, altEn, altAr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useDeleteCollectionImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) => deleteCollectionImage(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}
