# 開發指南

## 概述

本指南旨在為 相關功能的開發提供一系列規範和準則，以確保程式碼品質、可維護性、可擴展性及團隊協作效率。

## 模組結構

相關模組應遵循與 `src/dataset` 模組類似的結構，主要包含以下幾個部分：

- `controller`: 處理 HTTP 請求和回應。
- `service`: 包含業務邏輯，負責與資料層或其他服務互動。
- `interface`: 定義資料結構、請求和回應格式，以及其他相關介面。
- `dto` (Data Transfer Object): 用於資料傳輸，通常用於請求體、查詢參數和回應體。
- `entities`: 定義資料庫實體模型。
- `data-aggregator` (如果適用): 負責資料的聚合、轉換或預處理邏輯。

## 服務復用與模組依賴規範

### 開發前必須檢查現有模組

**在實作任何新功能或業務邏輯前，必須先進行以下檢查：**

1. **讀取相關模組的程式碼**

   - 檢查是否已有現成的 service 方法可以復用
   - 了解現有的業務邏輯實作方式
   - 確認是否有可共用的工具函式或 helper

2. **評估復用可行性**

   - 檢查現有 service 的參數和返回值是否符合需求
   - 確認業務邏輯是否完全吻合
   - 評估是否需要調整或擴展現有方法

3. **優先復用原則**
   - **優先使用現有的 service 方法**，避免重複實作相同邏輯
   - **優先使用統一的工具服務**（如 `SerialNumberService`、`ApprovalService` 等）
   - **只在確認無法復用時**才自行實作新的方法

### 復用範例與最佳實踐

#### ✅ 正確範例：使用 SerialNumberService 生成序號

```typescript
// ❌ 錯誤：手動實作序號生成邏輯
private async generateSerialNumber(): Promise<string> {
  const now = new Date();
  const prefix = `PERRO${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`;

  const lastRecord = await this.prisma.someModel.findFirst({
    where: { serialNumber: { startsWith: prefix } },
    orderBy: { serialNumber: 'desc' },
  });

  let sequence = 1;
  if (lastRecord) {
    const lastSequence = parseInt(lastRecord.serialNumber.slice(-5), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

// ✅ 正確：使用 SerialNumberService
private async generateSerialNumber(orderDate: Date): Promise<string> {
  const serialNumberKey = `${process.env.PARTICIPATION_MODE}_MODULE_NAME_${orderDate.toISOString().slice(0, 10).replace(/-/g, '')}`;
  return await this.serialNumberService.generate(
    serialNumberKey,
    `PREFIX{YY}{MM}{DD}{00000}`,
    { date: orderDate, autoSave: true }
  );
}
```

#### ✅ 正確範例：擴展 Service 以支援 Transaction 場景

**情境：在活動取消流程中需要建立退貨單，但該流程已經在一個 transaction 中執行**

**問題分析：**

```typescript
// 現有的 Service 方法會創建自己的 transaction
async create(dto: CreateParticipableEventReturnOrderDto) {
  const orm = await this.prisma.$transaction(async (tx) => {
    // 建立退貨單的邏輯
  });
}

// 但在活動取消流程中，已經有一個 transaction
async cancelEvent(id: number) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 更新活動狀態
    // 2. 查詢訂單
    // 3. 需要建立退貨單 ← 無法直接使用 create()，會造成巢狀 transaction
  });
}
```

**❌ 錯誤做法：繞過 Service 直接實作**

```typescript
// 在 ParticipableEventService 中直接使用 Prisma
private async processOrderReturns(tx: any, order: any) {
  await tx.participableEventReturnOrder.create({
    data: {
      serialNumber: await this.generateSerialNumber(orderDate),
      // ... 重複實作退貨單建立邏輯
    },
  });
}
```

**問題：**
- 重複實作業務邏輯
- 序號生成邏輯重複
- 業務邏輯分散，難以維護
- 未來修改需要改多處

**✅ 正確做法：擴展 Service 添加 `createInTransaction` 方法**

**步驟 1：在 Service 中添加支援 Transaction 的方法**

```typescript
// participable-event-return-order.service.ts

async create(dto: CreateParticipableEventReturnOrderDto) {
  const orm = await this.prisma.$transaction(async (tx) => {
    return await this.createInTransaction(tx, dto);  // 委派給新方法
  }).catch(catchPrismaErrorOrThrow(entityName));
  return plainToInstance(ParticipableEventReturnOrderEntity, orm);
}

/**
 * 在現有 transaction 中建立退貨單
 */
async createInTransaction(tx: any, dto: CreateParticipableEventReturnOrderDto) {
  // 完整的退貨單建立邏輯
  // 包含序號生成、項目建立等
}
```

**步驟 2：注入並使用 Service**

```typescript
// participable-event.service.ts

constructor(
  private readonly participableEventReturnOrderService: ParticipableEventReturnOrderService,
) {}

private async processOrderReturns(tx: any, order: any) {
  // 準備數據
  const user = {
    userId: order.participableEventOrderUser.userId,
    name: order.participableEventOrderUser.name,
    // ...
  };

  // 使用 Service 的 createInTransaction 方法
  await this.participableEventReturnOrderService.createInTransaction(tx, {
    participableEventId: order.participableEventId,
    orderDate: new Date(),
    remark: '活動取消自動退貨',
    user,
    items,
    orders: [{ id: order.id }],
  });
}
```

**優勢：**
- ✅ 代碼復用：業務邏輯集中在 Service 中
- ✅ 易於維護：修改邏輯只需改一處
- ✅ 類型安全：使用 DTO 確保數據一致性
- ✅ 職責分離：各 Service 專注自己的業務邏輯

**關鍵原則：**

> 當現有 Service 無法在特定場景（如 transaction 中）直接使用時，
> 應該**擴展 Service 添加新方法**，而不是繞過 Service 重複實作。

### 檢查清單

開發新功能時，請確認以下事項：

- [ ] 已閱讀相關模組的 service 檔案
- [ ] 已檢查是否有可復用的方法或工具
- [ ] 評估是否可以直接使用現有 Service 方法
- [ ] 如果無法直接使用（如 transaction 場景），考慮是否應該擴展 Service 而非重複實作
- [ ] 已使用統一的工具服務（如 SerialNumberService）
- [ ] 查詢資料時已包含所有必要的關聯資料（如 include 用戶信息）
- [ ] 程式碼遵循現有模組的實作模式
- [ ] 已移除不再使用的方法和依賴

### 決策流程圖

```
開始實作新功能
    ↓
檢查是否有相關 Service？
    ↓ 是
現有方法可以直接使用？
    ↓ 否
是否因為特殊場景（如 transaction）？
    ↓ 是
擴展 Service 添加新方法（如 createInTransaction）
    ↓
在新功能中注入並使用擴展的 Service
    ↓
完成 ✓

    ↓ 否（業務邏輯不同）
自行實作新方法
    ↓
但仍復用工具服務（如 SerialNumberService）
    ↓
完成 ✓
```

### 注意事項

- **優先擴展而非重複**：當現有 Service 無法在特定場景使用時，優先考慮擴展 Service（添加 `xxxInTransaction` 方法），而不是繞過 Service 重複實作
- **不要為了復用而強行復用**：如果現有方法的業務邏輯與需求完全不符，應該自行實作
- **部分復用也是一種好的實踐**：即使無法復用完整的 service，也應該復用其中的工具方法
- **保持一致性**：新功能的實作方式應與現有模組保持一致的風格和模式
- **清理未使用的代碼**：重構後記得移除不再使用的方法、導入和依賴注入

### 核心原則總結

**開發前先檢查，優先復用，必要時擴展，避免重複**

1. **檢查階段**
   - 開發任何新功能前，先查找是否有相關的 Service 或模組
   - 閱讀相關 Service 的程式碼，了解其提供的功能

2. **復用階段**
   - 如果現有方法完全符合需求，直接使用
   - 如果現有工具服務（如 SerialNumberService）可用，優先使用

3. **擴展階段**
   - 如果現有 Service 邏輯正確但無法在特定場景使用（如 transaction），擴展 Service 添加新方法
   - 命名規範：`xxxInTransaction`、`xxxWithOptions` 等
   - 原有方法應該委派給新方法，保持代碼一致性

4. **實作階段**
   - 只有在業務邏輯完全不同時，才自行實作新的邏輯
   - 即使自行實作，也要復用工具服務和輔助方法

5. **清理階段**
   - 重構後移除不再使用的方法
   - 移除不再需要的依賴注入
   - 移除不再使用的 import

**這樣做的好處：**
- 減少代碼重複，降低維護成本
- 業務邏輯集中，易於修改和測試
- 保持代碼庫的一致性和可讀性
- 新開發者更容易理解和使用現有功能

## Schema 定義與修改規範

- **開發功能前，必須先仔細閱讀 `prisma/schema.prisma` 文件，了解現有模型定義，避免不必要的衝突或重複。**
- 當 schema（如資料庫結構、Prisma schema 等）已經定義完成後，請勿隨意更動 schema，除非是因應既有功能的調整或優化。
- 若是新增一個全新的功能，且發現已有相關的 schema 存在，請先不要自行更改這些 schema，因為這些 schema 可能已經是團隊協議或其他功能依賴的結構。
- 如需調整既有 schema，請務必先與團隊討論並取得共識，避免影響其他功能或造成資料不一致。
- 只有在確定是新功能且無現有 schema 可用時，才可新增新的 schema 定義。

## 程式碼風格

請參考 `code-style-guide.md`。

## 測試規範

請參考 `testing-guidelines.md`。

## git規範

請參考 `git.md`。

## 文件撰寫

### 必讀文件

在進行文件撰寫前，請務必先閱讀以下文件風格指南：

- **系統架構文件風格指南**: [sa-documentation-style-guide.md](./sa-documentation-style-guide.md)
- **系統設計文件風格指南**: [sd-documentation-style-guide.md](./sd-documentation-style-guide.md)

### 一般規範

- 所有公開的類別、方法、函式都應該有清晰的 JSDoc 或 TypeScript Doc 註釋，說明其用途、參數、返回值和可能拋出的錯誤。
- 複雜的業務邏輯或演算法應在程式碼中添加適當的註釋，解釋其實現細節。
- API 文件應保持更新，與實際程式碼行為一致。
- 當有更新或調整相關功能時，請務必同步更新對應的文件（如 API 文件、設計規範、開發指南等），以確保文件內容與實際功能保持一致。

### 功能開發文件命名規範

- 功能開發文件請使用「global-keys」這種命名風格：全部小寫英文，單詞之間用短橫線（-）連接，簡明描述功能主題。
- 例如：`global-keys.md`、`user-login.md`
- 文件存放於 `docs/features/` 目錄下。

## 語言規範

- 所有中文內容都應使用繁體中文。
