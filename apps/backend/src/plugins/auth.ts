import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { prisma } from "../lib/prisma";

export const jwtPlugin = new Elysia({ name: "jwt" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "default-secret-change-me",
      exp: "1d",
    })
  )
  .use(
    jwt({
      name: "jwtRefresh",
      secret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-me",
      exp: "7d",
    })
  )
  .use(bearer());

export const authPlugin = new Elysia({ name: "Auth.Service" })
  .use(jwtPlugin)
  .macro({
    isSignIn: {
      async resolve({ jwt: jwtInstance, bearer: token, status }) {
        if (!token) return status(401, "Unauthorized");

        const payload = await jwtInstance.verify(token);
        if (!payload || !payload.sub) return status(401, "Invalid token");

        const user = await prisma.user.findUnique({
          where: { id: payload.sub as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        if (!user) return status(401, "User not found");

        return { user };
      },
    },
    isAdmin: {
      async resolve({ jwt: jwtInstance, bearer: token, status }) {
        if (!token) return status(401, "Unauthorized");

        const payload = await jwtInstance.verify(token);
        if (!payload || !payload.sub) return status(401, "Invalid token");

        const user = await prisma.user.findUnique({
          where: { id: payload.sub as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        if (!user) return status(401, "User not found");
        if (user.role !== "ADMIN") return status(403, "Forbidden");

        return { user };
      },
    },
    isEditor: {
      async resolve({ jwt: jwtInstance, bearer: token, status }) {
        if (!token) return status(401, "Unauthorized");

        const payload = await jwtInstance.verify(token);
        if (!payload || !payload.sub) return status(401, "Invalid token");

        const user = await prisma.user.findUnique({
          where: { id: payload.sub as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        if (!user) return status(401, "User not found");
        if (user.role !== "ADMIN" && user.role !== "EDITOR")
          return status(403, "Forbidden");

        return { user };
      },
    },
    optionalAuth: {
      async resolve({ jwt: jwtInstance, bearer: token }) {
        if (!token) return { user: null };

        const payload = await jwtInstance.verify(token);
        if (!payload || !payload.sub) return { user: null };

        const user = await prisma.user.findUnique({
          where: { id: payload.sub as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        return { user: user ?? null };
      },
    },
  });
