import { Elysia, status } from "elysia";
import { AuthService } from "./service";
import { AuthModel } from "./model";
import { jwtPlugin } from "../../plugins/auth";

export const auth = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)
  .post(
    "/sign-up",
    async ({ body, jwt, jwtRefresh }) => {
      const result = await AuthService.signUp(body);
      if (!result.ok) return status(result.status, { success: false as const, error: result.error });

      const user = result.data;
      const accessToken = await jwt.sign({ sub: user.id, role: user.role });
      const refreshToken = await jwtRefresh.sign({ sub: user.id });

      return {
        success: true as const,
        data: { user, accessToken, refreshToken },
      };
    },
    {
      body: AuthModel.signUpBody,
    }
  )
  .post(
    "/sign-in",
    async ({ body, jwt, jwtRefresh }) => {
      const result = await AuthService.signIn(body);
      if (!result.ok) return status(result.status, { success: false as const, error: result.error });

      const user = result.data;
      const accessToken = await jwt.sign({ sub: user.id, role: user.role });
      const refreshToken = await jwtRefresh.sign({ sub: user.id });

      return {
        success: true as const,
        data: { user, accessToken, refreshToken },
      };
    },
    {
      body: AuthModel.signInBody,
    }
  )
  .post(
    "/refresh",
    async ({ body, jwt, jwtRefresh }) => {
      const payload = await jwtRefresh.verify(body.refreshToken);
      if (!payload || !payload.sub)
        return status(401, { success: false as const, error: "Invalid refresh token" });

      const user = await AuthService.getUserById(payload.sub as string);
      if (!user)
        return status(401, { success: false as const, error: "User not found" });

      const accessToken = await jwt.sign({ sub: user.id, role: user.role });
      const newRefreshToken = await jwtRefresh.sign({ sub: user.id });

      return {
        success: true as const,
        data: { accessToken, refreshToken: newRefreshToken },
      };
    },
    {
      body: AuthModel.refreshBody,
    }
  );
