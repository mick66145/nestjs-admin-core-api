import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始執行資料庫種子...\n');

  // 定義 Seeder 型別並要執行的 seeders（順序很重要！）
  interface Seeder {
    run: () => Promise<void>;
    prisma?: any;
  }
  const seeders: Seeder[] = [];

  // 使用事務確保數據一致性
  if (seeders.length === 0) {
    console.log('⚠️ 沒有可執行的 seeders。');
    return;
  }
  await prisma.$transaction(async (tx) => {
    for (const seeder of seeders) {
      // 將 tx 傳遞給 seeder，讓它使用事務中的 prisma client
      seeder['prisma'] = tx as any;
      await seeder.run();
    }
  });

  console.log('\n🎉 資料庫種子執行完成！');
}

main()
  .catch((e) => {
    console.error('❌ 執行種子時發生錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
