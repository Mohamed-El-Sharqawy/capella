import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStones } from "./queries";
import {
  createStone,
  updateStone,
  deleteStone,
  type CreateStoneBody,
  type UpdateStoneBody,
} from "./mutations";

export const stoneKeys = {
  all: ["stones"] as const,
  list: () => [...stoneKeys.all, "list"] as const,
};

export function useStones() {
  return useQuery({
    queryKey: stoneKeys.list(),
    queryFn: fetchStones,
  });
}

export function useCreateStone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStoneBody) => createStone(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stoneKeys.all });
    },
  });
}

export function useUpdateStone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateStoneBody }) =>
      updateStone(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stoneKeys.all });
    },
  });
}

export function useDeleteStone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stoneKeys.all });
    },
  });
}
