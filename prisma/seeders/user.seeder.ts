import { BaseSeeder } from './base.seeder';
import * as bcrypt from 'bcrypt';

/**
 * 使用者 Seeder
 */
export class UserSeeder extends BaseSeeder {
  get name(): string {
    return 'UserSeeder';
  }

  async run(): Promise<void> {
    console.log(`🌱 執行 ${this.name}...`);

    // 確保管理員角色存在
    const adminRole = await this.prisma.role.findFirst({
      where: { name: '管理員' },
    });

    if (!adminRole) {
      throw new Error('找不到管理員角色，請先執行 RoleSeeder');
    }

    // 1. 建立 engineer 開發者帳號
    const engineerAccount = await this.prisma.userAccount.upsert({
      where: { id: 1 },
      update: {},
      create: {
        type: 'local',
        account: 'engineer',
        password: await bcrypt.hash('qweasdzxcC@', 10),
      },
    });

    const engineer = await this.prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'engineer管理者',
        email: 'engineer@engineer.com.tw',
        phone: null,
        isValid: true,
        isEnabled: true,
        isRoot: true, // 超級管理員
        userAccountId: engineerAccount.id,
      },
    });

    // 建立 engineer 與管理員角色的關聯
    await this.prisma.userAccountHasRole.upsert({
      where: {
        userAccountId_roleId: {
          userAccountId: engineerAccount.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userAccountId: engineerAccount.id,
        roleId: adminRole.id,
      },
    });

    console.log(
      `  ✅ 使用者已建立: ${engineer.name} (帳號: engineer, isRoot: true)`,
    );

    // 2. 建立網站管理員帳號
    const adminAccount = await this.prisma.userAccount.upsert({
      where: { id: 2 },
      update: {},
      create: {
        type: 'local',
        account: 'admin',
        password: await bcrypt.hash('qazwsxedcC@', 10),
      },
    });

    const admin = await this.prisma.user.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '網站管理員',
        email: 'admin@admin.com',
        phone: null,
        isValid: true,
        isEnabled: true,
        isRoot: false,
        userAccountId: adminAccount.id,
      },
    });

    // 建立 admin 與管理員角色的關聯
    await this.prisma.userAccountHasRole.upsert({
      where: {
        userAccountId_roleId: {
          userAccountId: adminAccount.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userAccountId: adminAccount.id,
        roleId: adminRole.id,
      },
    });

    console.log(
      `  ✅ 使用者已建立: ${admin.name} (帳號: admin, isRoot: false)`,
    );
  }
}
