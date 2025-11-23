import { PrismaClient } from '@prisma/client';

/**
 * Seeder 基礎類別
 * 所有 seeder 都應繼承此類別
 */
export abstract class BaseSeeder {
  constructor(protected prisma: PrismaClient) {}

  /**
   * 執行 seeder
   */
  abstract run(): Promise<void>;

  /**
   * Seeder 名稱（用於 log）
   */
  abstract get name(): string;
}
