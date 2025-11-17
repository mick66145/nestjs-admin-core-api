# 驗證碼功能系統設計文件

> **版本：** v1.0
> **更新日期：** 2025-11-17
> **文件類型：** 系統設計與技術規格文件

---

## 📋 目錄

- [1. 系統架構概述](#1-系統架構概述)
- [2. API 文件規範](#2-api-文件規範)
- [3. 資料結構定義](#3-資料結構定義)
- [4. 業務邏輯設計](#4-業務邏輯設計)
- [5. 錯誤處理機制](#5-錯誤處理機制)
- [6. 安全性設計](#6-安全性設計)
- [7. 效能考量](#7-效能考量)
- [8. 範例代碼](#8-範例代碼)
- [版本歷史](#版本歷史)

---

## 1. 系統架構概述

### 1.1 技術堆疊

| 層級             | 技術                     | 版本       | 用途                   |
| ---------------- | ------------------------ | ---------- | ---------------------- |
| 應用框架         | NestJS                   | 10.x       | Node.js 後端框架       |
| 程式語言         | TypeScript               | 5.x        | 型別安全的 JavaScript  |
| ORM              | Prisma                   | 5.x        | 資料庫 ORM             |
| 資料庫           | PostgreSQL               | 14+        | 關聯式資料庫           |
| 驗證套件         | class-validator          | 0.14.x     | DTO 參數驗證           |
| 轉換套件         | class-transformer        | 0.5.x      | 物件轉換               |
| 日期處理         | dayjs                    | 1.x        | 日期時間計算           |
| API 文件         | @nestjs/swagger          | 7.x        | OpenAPI/Swagger 文件   |

### 1.2 模組架構

```
src/verification/
├── dto/
│   └── verification.dto.ts              # 建立/驗證 DTO
├── entities/
│   └── verification.entity.ts           # Entity 實體
├── verification.controller.ts           # Controller 層
├── verification.service.ts              # Service 層
├── verification.interface.ts            # 介面定義（CodeType enum）
└── verification.module.ts               # Module 定義
```

### 1.3 分層架構

```
┌─────────────────────────────────────┐
│         客戶端應用程式                │
└─────────────────────────────────────┘
              ↓ HTTP/HTTPS
┌─────────────────────────────────────┐
│      Controller 層（路由處理）       │
│  - 參數驗證 (class-validator)       │
│  - Swagger 文件裝飾器               │
│  - HTTP 狀態碼處理                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Service 層（業務邏輯）         │
│  - 驗證碼產生邏輯                   │
│  - 驗證碼驗證邏輯                   │
│  - 過期檢查                         │
│  - 自動失效處理                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Prisma ORM（資料存取）         │
│  - SQL 查詢建構                     │
│  - 事務管理                         │
│  - 型別安全的資料庫操作             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    PostgreSQL 資料庫（資料儲存）    │
└─────────────────────────────────────┘
```

### 1.4 驗證碼配置系統

**配置檔案：** `src/config/verification/verification.config.ts`

```typescript
export const configFactory = () => ({
  codeLength: 6,           // 驗證碼長度
  codeType: 'number',      // 驗證碼類型
  expireMinutes: 10,       // 過期分鐘數
});
```

**配置使用：**

```typescript
// DTO 中使用配置作為預設值
const { codeLength, codeType, expireMinutes } = configFactory();

export class CreateVerificationDto {
  @ApiProperty({ default: codeLength })
  length: number = codeLength;

  @ApiProperty({ enum: CodeType, default: codeType })
  codeType: CodeType = codeType;

  @ApiProperty({ default: expireMinutes })
  expireMinutes: number = expireMinutes;
}
```

---

## 2. API 文件規範

### 2.1 API 基本資訊

| 項目         | 說明                                   |
| ------------ | -------------------------------------- |
| **基礎 URL** | `/api/verification`                    |
| **協定**     | HTTP/HTTPS                             |
| **資料格式** | JSON                                   |
| **字元編碼** | UTF-8                                  |
| **認證方式** | 不需要（驗證碼產生前應已完成帳號建立） |

### 2.2 API 端點清單

| HTTP Method | 端點路徑                    | 功能說明             | 認證 |
| ----------- | --------------------------- | -------------------- | ---- |
| POST        | /api/verification           | 產生驗證碼           | ❌   |
| POST        | /api/verification/verify    | 驗證驗證碼           | ❌   |

**注意事項：**
- 驗證碼 API 通常不需要 JWT 認證，因為使用者在驗證碼驗證前可能尚未登入
- 應透過其他安全機制（如頻率限制、IP 限制）保護 API

---

### 2.3 API 端點詳細規格

#### 2.3.1 產生驗證碼

**端點：** `POST /api/verification`

**說明：** 為指定使用者產生驗證碼，自動使該使用者的舊驗證碼失效。

**Request Body：**

```typescript
interface CreateVerificationDto {
  /** 使用者帳號 ID */
  userAccountId: number;

  /** 驗證碼長度（預設 6） */
  length?: number;

  /** 驗證碼類型（預設 number） */
  codeType?: CodeType;

  /** 過期分鐘數（預設 10） */
  expireMinutes?: number;
}

enum CodeType {
  /** 所有字元（數字+字母） */
  all = 'all',

  /** 純數字 */
  number = 'number',

  /** 數字+字母 */
  alphanumeric = 'alphanumeric',
}
```

**Request 範例：**

```json
{
  "userAccountId": 123,
  "length": 6,
  "codeType": "number",
  "expireMinutes": 10
}
```

**欄位說明：**

| 欄位路徑         | 類型     | 必填 | 預設值  | 說明                       |
| ---------------- | -------- | ---- | ------- | -------------------------- |
| `userAccountId`  | number   | ✅   | -       | 使用者帳號 ID              |
| `length`         | number   | ❌   | 6       | 驗證碼長度（4-12 位）      |
| `codeType`       | CodeType | ❌   | number  | 驗證碼類型                 |
| `expireMinutes`  | number   | ❌   | 10      | 過期分鐘數（1-60 分鐘）    |

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "id": 1,
  "userAccountId": 123,
  "code": "456789",
  "isValid": true,
  "createdAt": "2025-11-17T10:00:00.000Z",
  "expireAt": "2025-11-17T10:10:00.000Z",
  "usedAt": null
}
```

**Response 欄位說明：**

| 欄位路徑       | 類型     | 說明                           |
| -------------- | -------- | ------------------------------ |
| `id`           | number   | 驗證碼記錄 ID                  |
| `userAccountId`| number   | 使用者帳號 ID                  |
| `code`         | string   | 驗證碼（僅此次顯示）           |
| `isValid`      | boolean  | 是否有效（true）               |
| `createdAt`    | string   | 建立時間 (ISO 8601)            |
| `expireAt`     | string   | 過期時間 (ISO 8601)            |
| `usedAt`       | string   | 使用時間（初始為 null）        |

**失敗回應：**

**1. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "userAccountId must be a positive number",
    "length must be a positive number"
  ],
  "error": "Bad Request"
}
```

**2. 使用者帳號不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此帳號",
  "error": "Not Found"
}
```

---

#### 2.3.2 驗證驗證碼

**端點：** `POST /api/verification/verify`

**說明：** 驗證使用者輸入的驗證碼是否正確、有效且未過期。驗證成功後會自動標記為已使用。

**Request Body：**

```typescript
interface VerifyCodeDto {
  /** 使用者帳號 ID */
  userAccountId: number;

  /** 驗證碼 */
  code: string;
}
```

**Request 範例：**

```json
{
  "userAccountId": 123,
  "code": "456789"
}
```

**欄位說明：**

| 欄位路徑         | 類型   | 必填 | 說明                       |
| ---------------- | ------ | ---- | -------------------------- |
| `userAccountId`  | number | ✅   | 使用者帳號 ID              |
| `code`           | string | ✅   | 驗證碼                     |

**Response 回應：**

**成功回應 (204 No Content)：**

無回應內容。驗證成功後，驗證碼會被標記為已使用（`usedAt` 設定為當前時間）。

**失敗回應：**

**1. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "userAccountId must be a positive number",
    "code should not be empty"
  ],
  "error": "Bad Request"
}
```

**2. 驗證碼錯誤/過期/已使用 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "此驗證碼已過期或無效",
  "error": "Bad Request"
}
```

**注意事項：**

- 所有驗證失敗的情況（驗證碼不存在、錯誤、已過期、已使用）都返回相同的錯誤訊息
- 這是基於安全考量，避免攻擊者透過錯誤訊息差異收集資訊
- 驗證成功後，該驗證碼無法再次使用（一次性使用機制）

---

### 2.4 HTTP 狀態碼對照表

| 狀態碼 | 說明                 | 使用情境                             |
| ------ | -------------------- | ------------------------------------ |
| 200    | OK                   | 產生驗證碼成功                       |
| 204    | No Content           | 驗證驗證碼成功（無回應內容）         |
| 400    | Bad Request          | 參數驗證失敗、驗證碼錯誤/過期/已使用 |
| 404    | Not Found            | 使用者帳號不存在                     |
| 500    | Internal Server Error| 伺服器內部錯誤                       |

---

## 3. 資料結構定義

### 3.1 資料庫 Schema

**Prisma Schema 定義：**

```prisma
model Verification {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  /// 驗證碼
  code     String

  /// 是否有效
  isValid  Boolean   @default(true) @map("is_valid")

  /// 過期時間
  expireAt DateTime  @map("expire_at")

  /// 使用時間
  usedAt   DateTime? @map("used_at")

  /// 關聯的使用者帳號 ID
  userAccountId Int         @map("user_account_id")
  userAccount   UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)

  @@map("verification")
}
```

**資料表結構：**

| 欄位名稱         | 資料類型             | 限制條件           | 說明                         |
| ---------------- | -------------------- | ------------------ | ---------------------------- |
| `id`             | INTEGER              | PRIMARY KEY, AUTO  | 主鍵 ID，自動遞增            |
| `created_at`     | TIMESTAMPTZ(3)       | NOT NULL, DEFAULT  | 建立時間，預設為當前時間     |
| `updated_at`     | TIMESTAMPTZ(3)       | NOT NULL           | 更新時間，自動更新           |
| `code`           | VARCHAR              | NOT NULL           | 驗證碼（6-12 位字串）        |
| `is_valid`       | BOOLEAN              | NOT NULL, DEFAULT  | 是否有效，預設為 true        |
| `expire_at`      | TIMESTAMPTZ(3)       | NOT NULL           | 過期時間                     |
| `used_at`        | TIMESTAMPTZ(3)       | NULL               | 使用時間，NULL 表示未使用    |
| `user_account_id`| INTEGER              | NOT NULL, FK       | 關聯的使用者帳號 ID          |

**索引建議：**

```sql
-- 提升驗證查詢效能（複合索引）
CREATE INDEX idx_verification_user_code_valid
ON verification(user_account_id, code, is_valid, used_at);

-- 提升過期檢查效能
CREATE INDEX idx_verification_expire_at
ON verification(expire_at);

-- 提升自動失效查詢效能
CREATE INDEX idx_verification_user_valid_unused
ON verification(user_account_id, is_valid, used_at, expire_at);
```

**外鍵約束：**

```sql
-- 級聯刪除：當使用者帳號被刪除時，相關驗證碼也會被刪除
ALTER TABLE verification
ADD CONSTRAINT fk_verification_user_account
FOREIGN KEY (user_account_id)
REFERENCES user_account(id)
ON DELETE CASCADE;
```

---

### 3.2 Entity 定義

**VerificationEntity：**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VerificationEntity {
  /** 主鍵 ID */
  @Expose()
  @ApiProperty()
  id!: number;

  /** 使用者帳號 ID */
  @Expose()
  @ApiProperty()
  userAccountId!: number;

  /** 驗證碼 */
  @Expose()
  @ApiProperty({ description: '驗證碼' })
  code!: string;

  /** 是否有效 */
  @Expose()
  @ApiProperty({ description: '是否有效' })
  isValid!: boolean;

  /** 建立時間 */
  @Expose()
  @ApiProperty({ description: '建立時間' })
  createdAt!: Date;

  /** 到期時間 */
  @Expose()
  @ApiProperty({ description: '到期時間' })
  expireAt!: Date;

  /** 使用時間 */
  @Expose()
  @ApiProperty({ description: '使用時間' })
  usedAt?: Date;
}
```

**欄位說明：**

- 使用 `@Exclude()` 裝飾器預設排除所有欄位
- 使用 `@Expose()` 裝飾器明確指定要暴露的欄位
- 所有公開欄位都使用 `@ApiProperty` 提供 Swagger 文件
- `updatedAt` 欄位未暴露，因為對 API 使用者無實際意義

---

### 3.3 DTO 定義

#### 3.3.1 CreateVerificationDto

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { configFactory } from 'src/config/verification/verification.config';
import { CodeType } from '../verification.interface';

const { codeLength, codeType, expireMinutes } = configFactory();

export class CreateVerificationDto {
  /** 使用者帳號 ID */
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userAccountId!: number;

  /** 驗證碼長度 */
  @ApiProperty({ description: '驗證碼長度', default: codeLength })
  @IsInt()
  @IsPositive()
  length: number = codeLength;

  /** 驗證碼類型 */
  @ApiProperty({
    description: '驗證碼類型',
    enum: CodeType,
    default: codeType,
  })
  @IsEnum(CodeType)
  codeType: CodeType = codeType;

  /** 過期分鐘數 */
  @ApiProperty({ description: '過期分鐘數', default: expireMinutes })
  @IsInt()
  @IsPositive()
  expireMinutes: number = expireMinutes;
}
```

**驗證規則：**

| 欄位             | 驗證器           | 說明                 |
| ---------------- | ---------------- | -------------------- |
| `userAccountId`  | `@IsInt()`       | 必須為整數           |
| `userAccountId`  | `@IsPositive()`  | 必須為正數           |
| `length`         | `@IsInt()`       | 必須為整數           |
| `length`         | `@IsPositive()`  | 必須為正數           |
| `codeType`       | `@IsEnum()`      | 必須為 CodeType 之一 |
| `expireMinutes`  | `@IsInt()`       | 必須為整數           |
| `expireMinutes`  | `@IsPositive()`  | 必須為正數           |

---

#### 3.3.2 VerifyCodeDto

```typescript
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateVerificationDto } from './verification.dto';

export class VerifyCodeDto extends PickType(CreateVerificationDto, [
  'userAccountId',
] as const) {
  /** 驗證碼 */
  @ApiProperty({ description: '驗證碼' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}
```

**說明：**

- 使用 `PickType` 從 `CreateVerificationDto` 繼承 `userAccountId` 欄位及其驗證器
- 額外定義 `code` 欄位，用於驗證時傳入驗證碼

**等同於：**

```typescript
export class VerifyCodeDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userAccountId!: number;

  @ApiProperty({ description: '驗證碼' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}
```

---

### 3.4 Enum 定義

**CodeType Enum：**

```typescript
export enum CodeType {
  /** 所有字元（數字+大小寫字母） */
  all = 'all',

  /** 純數字 */
  number = 'number',

  /** 數字+字母 */
  alphanumeric = 'alphanumeric',
}
```

**CodeType 對應的字元集：**

```typescript
const codeTypeMap: {
  [key: string]: Parameters<typeof generateRandomString>[1];
} = {
  [CodeType.all]: ['ALL'],
  [CodeType.number]: ['NUMBER'],
  [CodeType.alphanumeric]: ['NUMBER', 'UPPER', 'LOWER'],
};
```

**字元集說明：**

| CodeType       | 字元集參數                | 實際字元範圍           |
| -------------- | ------------------------- | ---------------------- |
| `all`          | `['ALL']`                 | 0-9, A-Z, a-z          |
| `number`       | `['NUMBER']`              | 0-9                    |
| `alphanumeric` | `['NUMBER', 'UPPER', 'LOWER']` | 0-9, A-Z, a-z    |

---

### 3.5 資料關聯圖

```
UserAccount (使用者帳號)
  │
  │ 1:N
  │
  ↓
Verification (驗證碼)
  │
  ├─ userAccountId: Int (外鍵)
  └─ userAccount: UserAccount (關聯)
```

**關聯說明：**

- 一個使用者帳號可以有多個驗證碼記錄（1:N）
- 每個驗證碼必須關聯到一個使用者帳號
- 外鍵：`Verification.userAccountId` → `UserAccount.id`
- 級聯刪除：當使用者帳號被刪除時，相關驗證碼也會被刪除（`onDelete: Cascade`）

---

## 4. 業務邏輯設計

### 4.1 Service 層設計

**VerificationService 類別結構：**

```typescript
@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 產生驗證碼
   * 1. 驗證使用者帳號存在
   * 2. 產生隨機驗證碼
   * 3. 計算過期時間
   * 4. 使舊驗證碼失效
   * 5. 建立新驗證碼記錄
   */
  async create(dto: CreateVerificationDto): Promise<VerificationEntity>

  /**
   * 驗證驗證碼
   * 1. 查詢驗證碼（多條件）
   * 2. 檢查驗證碼存在
   * 3. 檢查是否過期
   * 4. 標記為已使用
   */
  async verify(dto: VerifyCodeDto): Promise<void>
}
```

---

### 4.2 產生驗證碼邏輯

**完整流程：**

```typescript
async create(dto: CreateVerificationDto) {
  const { userAccountId, length, codeType, expireMinutes } = dto;

  // 1. 驗證使用者帳號存在
  const user = await this.prisma.user.findFirst({
    where: { userAccountId },
  });
  abortIf(isNil(user), '無此帳號', HttpStatus.NOT_FOUND);

  // 2. 根據 codeType 產生驗證碼
  const type = codeTypeMap[codeType];
  const code = generateRandomString(length, type);
  // 例如：codeType = 'number', length = 6
  // 產生結果：'456789'

  // 3. 計算過期時間
  const expireAt = dayjs().add(expireMinutes, 'minute').toDate();
  // 例如：NOW() + 10 分鐘 = 2025-11-17T10:10:00.000Z

  // 4. 使用事務處理（確保原子性）
  try {
    const verification = await this.prisma.$transaction(async (tx) => {
      // 4a. 使舊驗證碼失效
      await tx.verification.updateMany({
        where: {
          userAccountId,
          isValid: true,
          usedAt: null,
          expireAt: { gt: new Date() },
        },
        data: { isValid: false },
      });

      // 4b. 建立新驗證碼
      return tx.verification.create({
        data: { userAccountId, code, expireAt },
      });
    });

    // 5. 轉換為 Entity 並返回
    return plainToInstance(VerificationEntity, verification);
  } catch (err) {
    dealWithPrismaClientError(err, entityName);
    throw err;
  }
}
```

**關鍵設計點：**

1. **使用者驗證**
   - 使用 `findFirst` 查詢使用者是否存在
   - 使用 `abortIf` 輔助函數拋出 404 錯誤

2. **驗證碼產生**
   - 使用 `generateRandomString` 工具函數產生隨機驗證碼
   - 根據 `codeType` 選擇不同的字元集

3. **過期時間計算**
   - 使用 `dayjs` 進行日期時間計算
   - 支援彈性設定過期分鐘數

4. **事務處理**
   - 使用 Prisma 事務確保兩步驟的原子性
   - 先失效舊驗證碼，再建立新驗證碼
   - 任一步驟失敗則全部回滾

5. **錯誤處理**
   - 使用 `dealWithPrismaClientError` 統一處理 Prisma 錯誤
   - 保留原始錯誤堆疊供除錯使用

---

### 4.3 自動失效舊驗證碼邏輯

**失效條件：**

```typescript
await tx.verification.updateMany({
  where: {
    userAccountId,           // 同一使用者
    isValid: true,           // 仍然有效
    usedAt: null,            // 尚未使用
    expireAt: { gt: new Date() }, // 尚未過期
  },
  data: { isValid: false },  // 標記為無效
});
```

**設計原理：**

1. **為什麼要自動失效？**
   - 確保每個使用者同一時間只有一個有效驗證碼
   - 避免多次產生驗證碼導致混淆
   - 提升安全性，舊驗證碼無法被利用

2. **失效哪些驗證碼？**
   - 同一使用者的驗證碼
   - 狀態仍然有效（`isValid: true`）
   - 尚未被使用（`usedAt: null`）
   - 尚未過期（`expireAt > NOW()`）

3. **已使用或已過期的驗證碼為何不失效？**
   - 已使用（`usedAt` 不為 null）：已經無法再次使用，無需失效
   - 已過期（`expireAt <= NOW()`）：已經無效，無需失效
   - 已失效（`isValid: false`）：已經無效，無需再次失效

4. **為什麼使用事務？**
   - 確保失效和建立兩步驟的原子性
   - 避免在失效後、建立前發生錯誤導致無驗證碼可用

---

### 4.4 驗證驗證碼邏輯

**完整流程：**

```typescript
async verify(dto: VerifyCodeDto) {
  const { userAccountId, code } = dto;

  // 1. 查詢驗證碼（多條件）
  const verification = await this.prisma.verification.findFirst({
    where: {
      userAccountId,
      code,
      isValid: true,
      usedAt: null,
    },
  });

  // 2. 檢查驗證碼存在 + 檢查是否過期
  const now = new Date();
  abortIf(
    isNil(verification) || verification!.expireAt < now,
    '此驗證碼已過期或無效',
  );

  // 3. 標記為已使用
  await this.prisma.verification.update({
    where: { id: verification!.id },
    data: { usedAt: now },
  });
}
```

**關鍵設計點：**

1. **多條件查詢**
   - 同時檢查：使用者 ID、驗證碼、有效性、使用狀態
   - 使用 `findFirst` 而非 `findUnique`（因為不是唯一索引）

2. **統一錯誤訊息**
   - 不存在、錯誤、已過期、已使用都返回相同訊息
   - 基於安全考量，避免資訊洩漏

3. **過期檢查**
   - 在業務邏輯層檢查過期（而非資料庫層）
   - 允許更靈活的過期處理邏輯

4. **立即標記已使用**
   - 驗證成功後立即更新 `usedAt`
   - 確保一次性使用機制

5. **無返回值**
   - 驗證成功返回 `void`
   - Controller 層將其轉換為 `204 No Content`

---

### 4.5 驗證碼產生演算法

**generateRandomString 工具函數：**

```typescript
/**
 * 產生隨機字串
 * @param length 字串長度
 * @param types 字元類型陣列
 * @returns 隨機字串
 */
function generateRandomString(
  length: number,
  types: ('NUMBER' | 'UPPER' | 'LOWER' | 'ALL')[]
): string {
  const NUMBER = '0123456789';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const ALL = NUMBER + UPPER + LOWER;

  let charset = '';
  types.forEach(type => {
    if (type === 'NUMBER') charset += NUMBER;
    if (type === 'UPPER') charset += UPPER;
    if (type === 'LOWER') charset += LOWER;
    if (type === 'ALL') charset = ALL;
  });

  let result = '';
  const charsetLength = charset.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    result += charset[randomIndex];
  }

  return result;
}
```

**使用範例：**

```typescript
// 純數字（6 位）
generateRandomString(6, ['NUMBER']);
// 結果：'456789', '123456', '987654'

// 數字+字母（8 位）
generateRandomString(8, ['NUMBER', 'UPPER', 'LOWER']);
// 結果：'aB3cD9eF', 'xY7zW2qR'

// 所有字元（10 位）
generateRandomString(10, ['ALL']);
// 結果：'aBc123XyZ9', '7pQr4sTuV8'
```

**安全性考量：**

- 使用 `Math.random()` 對於驗證碼應用場景足夠安全
- 如需更高安全性，建議使用 `crypto.randomBytes()`：

```typescript
import * as crypto from 'crypto';

function secureRandomString(length: number, charset: string): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}
```

---

## 5. 錯誤處理機制

### 5.1 錯誤處理流程

```
錯誤發生
  │
  ├─> Prisma 錯誤
  │   └─> dealWithPrismaClientError(err, entityName)
  │       ├─> 解析 Prisma 錯誤代碼
  │       ├─> 轉換為 HttpException
  │       └─> 拋出適當的 HTTP 狀態碼
  │
  ├─> 驗證錯誤 (class-validator)
  │   └─> NestJS ValidationPipe
  │       ├─> 收集所有驗證錯誤
  │       ├─> 格式化錯誤訊息
  │       └─> 返回 400 Bad Request
  │
  ├─> 業務邏輯錯誤
  │   └─> abortIf(condition, message, statusCode)
  │       ├─> 條件成立時拋出 HttpException
  │       └─> 包含自定義錯誤訊息和狀態碼
  │
  └─> 其他錯誤
      └─> NestJS ExceptionFilter
          └─> 返回 500 Internal Server Error
```

### 5.2 Prisma 錯誤處理

**常見 Prisma 錯誤代碼：**

| 錯誤代碼 | 說明                 | HTTP 狀態碼 | 處理方式                   |
| -------- | -------------------- | ----------- | -------------------------- |
| P2002    | 唯一性約束違反       | 400         | 返回「資料重複」錯誤       |
| P2025    | 記錄不存在           | 404         | 返回「資源不存在」錯誤     |
| P2003    | 外鍵約束違反         | 400         | 返回「關聯資料錯誤」       |

**dealWithPrismaClientError 使用範例：**

```typescript
try {
  const verification = await this.prisma.$transaction(async (tx) => {
    // ... 事務處理
  });
  return plainToInstance(VerificationEntity, verification);
} catch (err) {
  dealWithPrismaClientError(err, entityName);
  throw err;
}
```

---

### 5.3 業務邏輯錯誤處理

**abortIf 輔助函數：**

```typescript
/**
 * 當條件成立時，拋出 HttpException
 * @param condition 條件
 * @param message 錯誤訊息
 * @param statusCode HTTP 狀態碼（預設 400）
 */
function abortIf(
  condition: boolean,
  message: string,
  statusCode: HttpStatus = HttpStatus.BAD_REQUEST
): void {
  if (condition) {
    throw new HttpException(message, statusCode);
  }
}
```

**使用範例：**

```typescript
// 使用者帳號不存在
const user = await this.prisma.user.findFirst({
  where: { userAccountId },
});
abortIf(isNil(user), '無此帳號', HttpStatus.NOT_FOUND);

// 驗證碼錯誤或過期
const verification = await this.prisma.verification.findFirst({...});
const now = new Date();
abortIf(
  isNil(verification) || verification!.expireAt < now,
  '此驗證碼已過期或無效'
);
```

---

### 5.4 驗證錯誤處理

**class-validator 自動驗證：**

```typescript
// DTO 定義
export class CreateVerificationDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userAccountId!: number;

  @ApiProperty({ default: 6 })
  @IsInt()
  @IsPositive()
  length: number = 6;
}
```

**錯誤回應格式：**

```json
{
  "statusCode": 400,
  "message": [
    "userAccountId must be a positive number",
    "userAccountId must be an integer number",
    "length must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

### 5.5 統一錯誤回應格式

**標準錯誤回應：**

```typescript
interface ErrorResponse {
  /** HTTP 狀態碼 */
  statusCode: number;

  /** 錯誤訊息（可為字串或字串陣列） */
  message: string | string[];

  /** 錯誤類型 */
  error: string;
}
```

**範例：**

```json
{
  "statusCode": 400,
  "message": "此驗證碼已過期或無效",
  "error": "Bad Request"
}
```

**安全性考量：**

- 所有驗證失敗都返回相同的錯誤訊息
- 避免透過錯誤訊息差異洩漏資訊
- 例如：不區分「驗證碼不存在」和「驗證碼錯誤」

---

## 6. 安全性設計

### 6.1 驗證碼安全性原則

| 安全原則           | 實作方式                               | 說明                           |
| ------------------ | -------------------------------------- | ------------------------------ |
| 隨機性             | 使用 `Math.random()` 或 `crypto`       | 確保驗證碼不可預測             |
| 一次性使用         | `usedAt` 標記                          | 驗證成功後無法重複使用         |
| 短效期             | 預設 10 分鐘                           | 限制驗證碼有效時間             |
| 自動失效           | 新驗證碼產生時使舊驗證碼失效           | 避免多個驗證碼同時有效         |
| 統一錯誤訊息       | 所有失敗都返回相同訊息                 | 防止資訊洩漏                   |
| 防暴力破解         | 限制驗證嘗試次數（建議實作）           | 記錄失敗次數，超過則鎖定       |

### 6.2 防暴力破解機制（建議實作）

**限制驗證嘗試次數：**

```typescript
// 記錄驗證失敗次數的資料結構
interface VerificationAttempt {
  userAccountId: number;
  failCount: number;
  lastAttemptAt: Date;
}

// Redis 或記憶體快取
const attemptCache = new Map<number, VerificationAttempt>();

async verify(dto: VerifyCodeDto) {
  const { userAccountId, code } = dto;

  // 1. 檢查失敗次數
  const attempt = attemptCache.get(userAccountId);
  if (attempt && attempt.failCount >= 5) {
    // 5 次失敗後鎖定 30 分鐘
    const lockUntil = dayjs(attempt.lastAttemptAt).add(30, 'minute');
    if (dayjs().isBefore(lockUntil)) {
      throw new HttpException(
        '驗證次數過多，請稍後再試',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    // 鎖定時間過後，重置計數
    attemptCache.delete(userAccountId);
  }

  // 2. 執行驗證邏輯
  const verification = await this.prisma.verification.findFirst({...});

  if (!verification || verification.expireAt < new Date()) {
    // 驗證失敗，增加失敗計數
    const currentAttempt = attemptCache.get(userAccountId) || {
      userAccountId,
      failCount: 0,
      lastAttemptAt: new Date(),
    };
    currentAttempt.failCount++;
    currentAttempt.lastAttemptAt = new Date();
    attemptCache.set(userAccountId, currentAttempt);

    throw new HttpException(
      '此驗證碼已過期或無效',
      HttpStatus.BAD_REQUEST
    );
  }

  // 驗證成功，清除失敗記錄
  attemptCache.delete(userAccountId);

  // 3. 標記為已使用
  await this.prisma.verification.update({...});
}
```

**Redis 實作（建議用於生產環境）：**

```typescript
// 使用 Redis 儲存失敗次數
const key = `verification:attempt:${userAccountId}`;
const failCount = await redis.incr(key);

if (failCount === 1) {
  // 第一次失敗，設定過期時間 30 分鐘
  await redis.expire(key, 1800);
}

if (failCount >= 5) {
  throw new HttpException(
    '驗證次數過多，請稍後再試',
    HttpStatus.TOO_MANY_REQUESTS
  );
}

// 驗證成功後刪除記錄
await redis.del(key);
```

---

### 6.3 頻率限制（Rate Limiting）

**限制產生驗證碼頻率：**

```typescript
// 使用 Redis 實作頻率限制
async create(dto: CreateVerificationDto) {
  const { userAccountId } = dto;

  // 檢查是否在 1 分鐘內已產生過驗證碼
  const key = `verification:create:${userAccountId}`;
  const lastCreateTime = await redis.get(key);

  if (lastCreateTime) {
    const timeElapsed = Date.now() - parseInt(lastCreateTime);
    const waitTime = 60000 - timeElapsed; // 60 秒

    if (waitTime > 0) {
      throw new HttpException(
        `請稍後再試（${Math.ceil(waitTime / 1000)} 秒後）`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  // 產生驗證碼
  const verification = await this.prisma.$transaction(async (tx) => {...});

  // 記錄產生時間（60 秒後自動過期）
  await redis.setex(key, 60, Date.now().toString());

  return plainToInstance(VerificationEntity, verification);
}
```

**IP 層級的頻率限制（Nginx/中介層）：**

```nginx
# Nginx 設定
limit_req_zone $binary_remote_addr zone=verification:10m rate=10r/m;

location /api/verification {
  limit_req zone=verification burst=5;
  proxy_pass http://backend;
}
```

---

### 6.4 HTTPS 傳輸

**強制使用 HTTPS：**

- 所有驗證碼相關的 API 必須使用 HTTPS
- 在 Nginx/Load Balancer 層強制重導向
- 保護驗證碼在傳輸中的安全

**Nginx 設定範例：**

```nginx
server {
  listen 80;
  server_name api.example.com;

  # 強制重導向到 HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl;
  server_name api.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location /api/verification {
    proxy_pass http://backend;
  }
}
```

---

### 6.5 安全性檢查清單

**開發階段：**

- [ ] 使用密碼學安全的隨機函數產生驗證碼
- [ ] 實作一次性使用機制（`usedAt` 標記）
- [ ] 設定合理的過期時間（5-30 分鐘）
- [ ] 所有驗證失敗返回統一錯誤訊息
- [ ] 實作自動失效舊驗證碼機制

**測試階段：**

- [ ] 測試驗證碼的隨機性（不可預測）
- [ ] 測試一次性使用（無法重複驗證）
- [ ] 測試過期機制（過期後無法驗證）
- [ ] 測試自動失效（新驗證碼產生後舊碼失效）
- [ ] 測試錯誤訊息（不洩漏資訊）

**生產環境：**

- [ ] 啟用 HTTPS 強制加密
- [ ] 實作頻率限制（產生和驗證）
- [ ] 實作防暴力破解機制（限制嘗試次數）
- [ ] 實作 IP 層級的速率限制
- [ ] 設定監控和告警（異常行為偵測）
- [ ] 定期清理過期驗證碼資料

---

## 7. 效能考量

### 7.1 資料庫效能優化

**索引策略：**

```sql
-- 驗證查詢的複合索引（最常用）
CREATE INDEX idx_verification_user_code_valid
ON verification(user_account_id, code, is_valid, used_at);

-- 過期檢查索引
CREATE INDEX idx_verification_expire_at
ON verification(expire_at);

-- 自動失效查詢索引
CREATE INDEX idx_verification_user_valid_unused
ON verification(user_account_id, is_valid, used_at, expire_at);
```

**查詢優化：**

```typescript
// 使用複合索引的查詢（高效）
const verification = await this.prisma.verification.findFirst({
  where: {
    userAccountId,  // 索引第 1 欄位
    code,           // 索引第 2 欄位
    isValid: true,  // 索引第 3 欄位
    usedAt: null,   // 索引第 4 欄位
  },
});

// 避免全表掃描
// ❌ 不好：沒有使用索引
where: {
  expireAt: { gt: new Date() },
}

// ✅ 好：使用複合索引
where: {
  userAccountId,
  isValid: true,
  usedAt: null,
  expireAt: { gt: new Date() },
}
```

---

### 7.2 快取策略（選用）

**Redis 快取驗證結果（短時間內避免重複驗證）：**

```typescript
async verify(dto: VerifyCodeDto) {
  const { userAccountId, code } = dto;

  // 檢查快取（避免重複驗證同一驗證碼）
  const cacheKey = `verification:verified:${userAccountId}:${code}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    // 已驗證過（1 分鐘內），直接返回成功
    return;
  }

  // 執行驗證邏輯
  const verification = await this.prisma.verification.findFirst({...});
  // ... 驗證邏輯 ...

  // 驗證成功，快取結果（60 秒）
  await redis.setex(cacheKey, 60, '1');
}
```

**注意事項：**
- 快取時間應較短（建議 30-60 秒）
- 僅快取驗證成功的結果
- 驗證失敗不應快取（避免鎖定正確驗證碼）

---

### 7.3 資料清理策略

**定期清理過期驗證碼：**

```typescript
// 每日清理過期且已使用的驗證碼（保留 30 天供審計）
@Cron('0 2 * * *') // 每天凌晨 2 點執行
async cleanExpiredVerifications() {
  const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

  await this.prisma.verification.deleteMany({
    where: {
      OR: [
        // 已使用且超過 30 天
        {
          usedAt: { not: null, lt: thirtyDaysAgo },
        },
        // 已過期且超過 7 天
        {
          usedAt: null,
          expireAt: { lt: dayjs().subtract(7, 'day').toDate() },
        },
      ],
    },
  });

  this.logger.log('Expired verifications cleaned');
}
```

**清理策略說明：**

| 清理項目         | 保留時間 | 說明                       |
| ---------------- | -------- | -------------------------- |
| 已使用驗證碼     | 30 天    | 供審計和問題追蹤使用       |
| 已過期未使用     | 7 天     | 避免資料庫膨脹             |
| 有效驗證碼       | 不清理   | 等待使用或過期             |

---

### 7.4 並發處理

**使用事務處理並發問題：**

```typescript
// Prisma 事務自動處理並發鎖定
const verification = await this.prisma.$transaction(async (tx) => {
  // 使舊驗證碼失效（行級鎖定）
  await tx.verification.updateMany({
    where: {
      userAccountId,
      isValid: true,
      usedAt: null,
      expireAt: { gt: new Date() },
    },
    data: { isValid: false },
  });

  // 建立新驗證碼
  return tx.verification.create({
    data: { userAccountId, code, expireAt },
  });
});
```

**事務的作用：**

1. **原子性**：兩步驟全部成功或全部失敗
2. **隔離性**：避免並發請求互相干擾
3. **一致性**：確保同一時間只有一個有效驗證碼

---

### 7.5 效能監控

**需要監控的指標：**

1. **產生驗證碼回應時間**
   - 目標：< 300ms
   - 包含：資料庫事務、驗證碼產生

2. **驗證驗證碼回應時間**
   - 目標：< 200ms
   - 包含：資料庫查詢、更新

3. **資料庫連線池使用率**
   - 目標：< 80%
   - 避免連線池耗盡

4. **驗證碼產生頻率**
   - 監控每分鐘產生的驗證碼數量
   - 偵測異常行為（如攻擊）

5. **驗證失敗率**
   - 監控驗證失敗的比例
   - 協助調整過期時間和安全機制

---

## 8. 範例代碼

### 8.1 前端整合範例（TypeScript）

**產生驗證碼：**

```typescript
import axios from 'axios';

interface CreateVerificationDto {
  userAccountId: number;
  length?: number;
  codeType?: 'all' | 'number' | 'alphanumeric';
  expireMinutes?: number;
}

interface VerificationEntity {
  id: number;
  userAccountId: number;
  code: string;
  isValid: boolean;
  createdAt: string;
  expireAt: string;
  usedAt?: string;
}

async function generateVerificationCode(
  data: CreateVerificationDto,
): Promise<VerificationEntity> {
  const response = await axios.post(
    '/api/verification',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}

// 使用範例：註冊後產生 Email 驗證碼
const registerUser = async (email: string, password: string) => {
  // 1. 建立使用者帳號
  const userResponse = await axios.post('/api/user-accounts', {
    email,
    password,
  });

  const userAccountId = userResponse.data.id;

  // 2. 產生驗證碼
  const verification = await generateVerificationCode({
    userAccountId,
    length: 6,
    codeType: 'number',
    expireMinutes: 10,
  });

  console.log('驗證碼已產生:', verification.code);
  console.log('有效期限:', verification.expireAt);

  // 3. 發送 Email（後端處理）
  await axios.post('/api/email/send-verification', {
    email,
    code: verification.code,
  });

  return {
    userAccountId,
    verificationId: verification.id,
  };
};
```

---

**驗證驗證碼：**

```typescript
interface VerifyCodeDto {
  userAccountId: number;
  code: string;
}

async function verifyCode(
  data: VerifyCodeDto,
): Promise<void> {
  await axios.post(
    '/api/verification/verify',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

// 使用範例：驗證 Email 驗證碼
const activateAccount = async (userAccountId: number, code: string) => {
  try {
    // 1. 驗證驗證碼
    await verifyCode({
      userAccountId,
      code,
    });

    // 2. 啟用使用者帳號
    await axios.put(`/api/user-accounts/${userAccountId}/activate`);

    console.log('帳號已成功啟用');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 400) {
        console.error('驗證碼錯誤:', error.response.data.message);
        // 顯示錯誤訊息給使用者
      }
    }
  }
};
```

---

**完整註冊+驗證流程：**

```typescript
// 註冊頁面
const handleRegister = async (email: string, password: string) => {
  try {
    // 1. 註冊帳號並產生驗證碼
    const { userAccountId } = await registerUser(email, password);

    // 2. 顯示驗證碼輸入頁面
    navigate('/verify-email', { state: { userAccountId } });

    // 3. 顯示提示訊息
    showMessage(`驗證碼已發送至 ${email}`);
  } catch (error) {
    console.error('註冊失敗:', error);
  }
};

// 驗證碼輸入頁面
const handleVerifyCode = async (userAccountId: number, code: string) => {
  try {
    // 1. 驗證驗證碼
    await verifyCode({ userAccountId, code });

    // 2. 顯示成功訊息
    showMessage('Email 驗證成功！');

    // 3. 導向登入頁面
    navigate('/login');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 400) {
        showError('驗證碼錯誤或已過期，請重新產生');
      }
    }
  }
};

// 重新發送驗證碼
const handleResendCode = async (userAccountId: number) => {
  try {
    const verification = await generateVerificationCode({
      userAccountId,
      length: 6,
      codeType: 'number',
      expireMinutes: 10,
    });

    showMessage('驗證碼已重新發送');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 429) {
        showError('請求過於頻繁，請稍後再試');
      }
    }
  }
};
```

---

### 8.2 忘記密碼流程範例

**後端 API：**

```typescript
// forgot-password.controller.ts
@Controller('auth')
export class ForgotPasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
  ) {}

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const { email } = dto;

    // 1. 查詢使用者
    const user = await this.userService.findByEmail(email);

    // 基於安全考量，無論帳號是否存在都返回成功
    if (!user) {
      return {
        message: '如果該帳號存在，驗證碼已發送至您的 Email',
      };
    }

    // 2. 產生驗證碼
    const verification = await this.verificationService.create({
      userAccountId: user.userAccountId,
      length: 6,
      codeType: CodeType.number,
      expireMinutes: 15, // 密碼重設建議較長的有效期限
    });

    // 3. 發送 Email
    await this.emailService.sendPasswordResetEmail(
      email,
      verification.code,
    );

    return {
      message: '如果該帳號存在，驗證碼已發送至您的 Email',
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const { email, code, newPassword } = dto;

    // 1. 查詢使用者
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new HttpException(
        '驗證碼錯誤或已過期',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. 驗證驗證碼
    await this.verificationService.verify({
      userAccountId: user.userAccountId,
      code,
    });

    // 3. 更新密碼
    await this.userService.updatePassword(
      user.userAccountId,
      newPassword,
    );

    return {
      message: '密碼已成功重設',
    };
  }
}
```

**前端整合：**

```typescript
// 忘記密碼頁面
const handleForgotPassword = async (email: string) => {
  try {
    await axios.post('/api/auth/forgot-password', { email });

    // 顯示驗證碼輸入頁面
    navigate('/reset-password', { state: { email } });

    showMessage('驗證碼已發送至您的 Email');
  } catch (error) {
    console.error('發送驗證碼失敗:', error);
  }
};

// 重設密碼頁面
const handleResetPassword = async (
  email: string,
  code: string,
  newPassword: string,
) => {
  try {
    await axios.post('/api/auth/reset-password', {
      email,
      code,
      newPassword,
    });

    showMessage('密碼已成功重設');
    navigate('/login');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 400) {
        showError('驗證碼錯誤或已過期');
      }
    }
  }
};
```

---

### 8.3 測試範例

**單元測試（Service 層）：**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { PrismaService } from 'src/_libs/prisma/prisma.service';

describe('VerificationService', () => {
  let service: VerificationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
            verification: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('應該成功產生驗證碼', async () => {
      const dto = {
        userAccountId: 123,
        length: 6,
        codeType: CodeType.number,
        expireMinutes: 10,
      };

      const mockUser = { id: 1, userAccountId: 123 };
      const mockVerification = {
        id: 1,
        userAccountId: 123,
        code: '456789',
        isValid: true,
        expireAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.verification, 'updateMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.verification, 'create').mockResolvedValue(mockVerification);
      jest.spyOn(prisma, '$transaction').mockImplementation((callback: any) =>
        callback(prisma),
      );

      const result = await service.create(dto);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        userAccountId: 123,
        code: expect.any(String),
      }));
      expect(result.code).toHaveLength(6);
      expect(/^\d+$/.test(result.code)).toBe(true); // 純數字
    });

    it('應該在使用者不存在時拋出 404 錯誤', async () => {
      const dto = {
        userAccountId: 999,
        length: 6,
        codeType: CodeType.number,
        expireMinutes: 10,
      };

      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow('無此帳號');
    });
  });

  describe('verify', () => {
    it('應該驗證正確的驗證碼', async () => {
      const dto = {
        userAccountId: 123,
        code: '456789',
      };

      const mockVerification = {
        id: 1,
        userAccountId: 123,
        code: '456789',
        isValid: true,
        expireAt: new Date(Date.now() + 600000), // 10 分鐘後
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.verification, 'findFirst').mockResolvedValue(mockVerification);
      jest.spyOn(prisma.verification, 'update').mockResolvedValue({
        ...mockVerification,
        usedAt: new Date(),
      });

      await expect(service.verify(dto)).resolves.not.toThrow();
    });

    it('應該在驗證碼錯誤時拋出錯誤', async () => {
      const dto = {
        userAccountId: 123,
        code: 'wrong-code',
      };

      jest.spyOn(prisma.verification, 'findFirst').mockResolvedValue(null);

      await expect(service.verify(dto)).rejects.toThrow(
        '此驗證碼已過期或無效',
      );
    });

    it('應該在驗證碼已過期時拋出錯誤', async () => {
      const dto = {
        userAccountId: 123,
        code: '456789',
      };

      const mockVerification = {
        id: 1,
        userAccountId: 123,
        code: '456789',
        isValid: true,
        expireAt: new Date(Date.now() - 600000), // 10 分鐘前（已過期）
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.verification, 'findFirst').mockResolvedValue(mockVerification);

      await expect(service.verify(dto)).rejects.toThrow(
        '此驗證碼已過期或無效',
      );
    });
  });
});
```

---

**E2E 測試（整合測試）：**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('VerificationController (e2e)', () => {
  let app: INestApplication;
  let userAccountId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 建立測試使用者
    const userResponse = await request(app.getHttpServer())
      .post('/api/user-accounts')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    userAccountId = userResponse.body.userAccountId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/verification', () => {
    it('應該成功產生驗證碼', () => {
      return request(app.getHttpServer())
        .post('/api/verification')
        .send({
          userAccountId,
          length: 6,
          codeType: 'number',
          expireMinutes: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('code');
          expect(res.body.code).toHaveLength(6);
          expect(res.body.userAccountId).toBe(userAccountId);
        });
    });

    it('應該在使用者不存在時返回 404', () => {
      return request(app.getHttpServer())
        .post('/api/verification')
        .send({
          userAccountId: 99999,
          length: 6,
          codeType: 'number',
          expireMinutes: 10,
        })
        .expect(404);
    });
  });

  describe('POST /api/verification/verify', () => {
    let verificationCode: string;

    beforeEach(async () => {
      // 產生驗證碼
      const response = await request(app.getHttpServer())
        .post('/api/verification')
        .send({
          userAccountId,
          length: 6,
          codeType: 'number',
          expireMinutes: 10,
        });

      verificationCode = response.body.code;
    });

    it('應該成功驗證正確的驗證碼', () => {
      return request(app.getHttpServer())
        .post('/api/verification/verify')
        .send({
          userAccountId,
          code: verificationCode,
        })
        .expect(204);
    });

    it('應該在驗證碼錯誤時返回 400', () => {
      return request(app.getHttpServer())
        .post('/api/verification/verify')
        .send({
          userAccountId,
          code: 'wrong-code',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('此驗證碼已過期或無效');
        });
    });

    it('應該無法重複使用已驗證的驗證碼', async () => {
      // 第一次驗證（成功）
      await request(app.getHttpServer())
        .post('/api/verification/verify')
        .send({
          userAccountId,
          code: verificationCode,
        })
        .expect(204);

      // 第二次驗證（失敗）
      return request(app.getHttpServer())
        .post('/api/verification/verify')
        .send({
          userAccountId,
          code: verificationCode,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('此驗證碼已過期或無效');
        });
    });
  });
});
```

---

## 版本歷史

| 版本 | 日期       | 說明                                             | 作者  |
| ---- | ---------- | ------------------------------------------------ | ----- |
| v1.0 | 2025-11-17 | 初版發布，基於現有程式碼分析撰寫系統設計文件     | Claude |

---

**© 2025 Sys Public Property API Documentation Team. All rights reserved.**
