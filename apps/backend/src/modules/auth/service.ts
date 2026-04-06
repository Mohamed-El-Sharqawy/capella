import { hash, compare } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type { AuthModel } from "./model";

type ServiceError = { ok: false; error: string; status: number };
type ServiceOk<T> = { ok: true; data: T };
type ServiceResult<T> = ServiceOk<T> | ServiceError;

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

export abstract class AuthService {
  static async signUp(
    body: AuthModel["signUpBody"]
  ): Promise<ServiceResult<{ id: string; email: string; firstName: string; lastName: string; role: string }>> {
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) return { ok: false, error: "Email already registered", status: 409 };

    const hashedPassword = await hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
      },
      select: USER_SELECT,
    });

    return { ok: true, data: user };
  }

  static async signIn(
    body: AuthModel["signInBody"]
  ): Promise<ServiceResult<{ id: string; email: string; firstName: string; lastName: string; role: string }>> {
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.password) return { ok: false, error: "Invalid credentials", status: 401 };

    const valid = await compare(body.password, user.password);
    if (!valid) return { ok: false, error: "Invalid credentials", status: 401 };

    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  }
}
