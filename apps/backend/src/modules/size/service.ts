import { prisma } from "../../lib/prisma";
import type { SizeModel } from "./model";

export abstract class SizeService {
  static async list() {
    return prisma.size.findMany({
      orderBy: { position: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.size.findUnique({ where: { id } });
  }

  static async create(body: SizeModel["createBody"]) {
    return prisma.size.create({ data: body });
  }

  static async update(id: string, body: SizeModel["updateBody"]) {
    const existing = await prisma.size.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.size.update({ where: { id }, data: body });
  }

  static async delete(id: string) {
    const existing = await prisma.size.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.size.delete({ where: { id } });
    return true;
  }
}
