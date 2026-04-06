import { prisma } from "../../lib/prisma";
import type { ColorModel } from "./model";

export abstract class ColorService {
  static async list() {
    return prisma.color.findMany({
      orderBy: { nameEn: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.color.findUnique({ where: { id } });
  }

  static async create(body: ColorModel["createBody"]) {
    return prisma.color.create({ data: body });
  }

  static async update(id: string, body: ColorModel["updateBody"]) {
    const existing = await prisma.color.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.color.update({ where: { id }, data: body });
  }

  static async delete(id: string) {
    const existing = await prisma.color.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.color.delete({ where: { id } });
    return true;
  }
}
