import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/features/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ("ADMIN" | "EDITOR")[];
}

export function AuthGuard({ children, requiredRoles = ["ADMIN", "EDITOR"] }: AuthGuardProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const { data: response, isLoading, isError } = useCurrentUser();

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isChecking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !response?.data) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = response.data;

  if (!requiredRoles.includes(user.role as "ADMIN" | "EDITOR")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
