import { api } from "@/lib/api";
import type { Color } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export function fetchColors() {
  return api.get<ApiResponse<Color[]>>("/api/colors");
}
