import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMaterials } from "./queries";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  type CreateMaterialBody,
  type UpdateMaterialBody,
} from "./mutations";

export const materialKeys = {
  all: ["materials"] as const,
  list: () => [...materialKeys.all, "list"] as const,
};

export function useMaterials() {
  return useQuery({
    queryKey: materialKeys.list(),
    queryFn: fetchMaterials,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMaterialBody) => createMaterial(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMaterialBody }) =>
      updateMaterial(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}
