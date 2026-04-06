import { prisma } from "../../lib/prisma";
import type { MaterialModel } from "./model";

export abstract class MaterialService {
  static async list() {
    return prisma.material.findMany({
      orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    });
  }

  static async getById(id: string) {
    return prisma.material.findUnique({ where: { id } });
  }

  static async create(body: MaterialModel["createBody"]) {
    return prisma.material.create({ data: body });
  }

  static async update(id: string, body: MaterialModel["updateBody"]) {
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.material.update({ where: { id }, data: body });
  }

  static async delete(id: string) {
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.material.delete({ where: { id } });
    return true;
  }
}
