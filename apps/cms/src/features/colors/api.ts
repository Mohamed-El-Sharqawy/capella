import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchColors } from "./queries";
import {
  createColor,
  updateColor,
  deleteColor,
  type CreateColorBody,
  type UpdateColorBody,
} from "./mutations";

export const colorKeys = {
  all: ["colors"] as const,
  list: () => [...colorKeys.all, "list"] as const,
};

export function useColors() {
  return useQuery({
    queryKey: colorKeys.list(),
    queryFn: fetchColors,
  });
}

export function useCreateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateColorBody) => createColor(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: colorKeys.all });
    },
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateColorBody }) =>
      updateColor(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: colorKeys.all });
    },
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteColor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: colorKeys.all });
    },
  });
}
