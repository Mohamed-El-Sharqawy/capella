import { api } from "@/lib/api";
import type { Size } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export function fetchSizes() {
  return api.get<ApiResponse<Size[]>>("/api/sizes");
}
