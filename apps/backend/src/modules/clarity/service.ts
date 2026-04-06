import { prisma } from "../../lib/prisma";
import type { ClarityModel } from "./model";

export abstract class ClarityService {
  static async list() {
    return prisma.clarity.findMany({
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    });
  }

  static async getById(id: string) {
    return prisma.clarity.findUnique({ where: { id } });
  }

  static async create(body: ClarityModel["createBody"]) {
    return prisma.clarity.create({ data: body });
  }

  static async update(id: string, body: ClarityModel["updateBody"]) {
    const existing = await prisma.clarity.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.clarity.update({ where: { id }, data: body });
  }

  static async delete(id: string) {
    const existing = await prisma.clarity.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.clarity.delete({ where: { id } });
    return true;
  }
}
