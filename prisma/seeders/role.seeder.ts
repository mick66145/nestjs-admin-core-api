import { BaseSeeder } from './base.seeder';

/**
 * 角色 Seeder
 */
export class RoleSeeder extends BaseSeeder {
  get name(): string {
    return 'RoleSeeder';
  }

  async run(): Promise<void> {
    console.log(`🌱 執行 ${this.name}...`);

    // 建立管理員角色
    const adminRole = await this.prisma.role.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '管理員',
        isEnabled: true,
      },
    });

    console.log(`  ✅ 角色已建立: ${adminRole.name} (ID: ${adminRole.id})`);
  }
}
