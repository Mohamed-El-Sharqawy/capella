import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClarities } from "./queries";
import {
  createClarity,
  updateClarity,
  deleteClarity,
  type CreateClarityBody,
  type UpdateClarityBody,
} from "./mutations";

export const clarityKeys = {
  all: ["clarities"] as const,
  list: () => [...clarityKeys.all, "list"] as const,
};

export function useClarities() {
  return useQuery({
    queryKey: clarityKeys.list(),
    queryFn: fetchClarities,
  });
}

export function useCreateClarity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClarityBody) => createClarity(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clarityKeys.all });
    },
  });
}

export function useUpdateClarity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClarityBody }) =>
      updateClarity(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clarityKeys.all });
    },
  });
}

export function useDeleteClarity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClarity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clarityKeys.all });
    },
  });
}
