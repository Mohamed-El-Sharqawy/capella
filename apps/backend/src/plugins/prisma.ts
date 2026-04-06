import { Elysia } from "elysia";
import { prisma } from "../lib/prisma";

export const prismaPlugin = new Elysia({ name: "prisma" })
  .decorate("db", prisma);
