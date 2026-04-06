import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSizes } from "./queries";
import {
  createSize,
  updateSize,
  deleteSize,
  type CreateSizeBody,
  type UpdateSizeBody,
} from "./mutations";

export const sizeKeys = {
  all: ["sizes"] as const,
  list: () => [...sizeKeys.all, "list"] as const,
};

export function useSizes() {
  return useQuery({
    queryKey: sizeKeys.list(),
    queryFn: fetchSizes,
  });
}

export function useCreateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSizeBody) => createSize(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeKeys.all });
    },
  });
}

export function useUpdateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateSizeBody }) =>
      updateSize(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeKeys.all });
    },
  });
}

export function useDeleteSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeKeys.all });
    },
  });
}
