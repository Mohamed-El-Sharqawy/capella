import { api } from "@/lib/api";
import type { User } from "@ecommerce/shared-types";
import type { ApiResponse } from "@ecommerce/shared-types";

export function fetchCurrentUser() {
  return api.get<ApiResponse<User>>("/api/users/me");
}
