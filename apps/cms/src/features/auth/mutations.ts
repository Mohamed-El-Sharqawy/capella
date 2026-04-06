import { api } from "@/lib/api";
import type { ApiResponse } from "@ecommerce/shared-types";

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export function login(body: LoginBody) {
  return api.post<ApiResponse<LoginResponse>>("/api/auth/sign-in", body);
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
}
