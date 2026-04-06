import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchCurrentUser } from "./queries";
import { login, logout, type LoginBody } from "./mutations";

export const authKeys = {
  user: ["auth", "user"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: fetchCurrentUser,
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginBody) => login(body),
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        window.location.href = "/";
      }
    },
  });
}

export { logout };
