import { prisma } from "../../lib/prisma";
import type { StoneModel } from "./model";

export abstract class StoneService {
  static async list() {
    return prisma.stone.findMany({
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    });
  }

  static async getById(id: string) {
    return prisma.stone.findUnique({ where: { id } });
  }

  static async create(body: StoneModel["createBody"]) {
    return prisma.stone.create({ data: body });
  }

  static async update(id: string, body: StoneModel["updateBody"]) {
    const existing = await prisma.stone.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.stone.update({ where: { id }, data: body });
  }

  static async delete(id: string) {
    const existing = await prisma.stone.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.stone.delete({ where: { id } });
    return true;
  }
}
