# 使用者帳號管理功能系統設計文件

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
| 密碼加密         | bcrypt                   | 5.x        | 密碼雜湊加密           |
| API 文件         | @nestjs/swagger          | 7.x        | OpenAPI/Swagger 文件   |

### 1.2 模組架構

```
src/user-account/
├── dto/
│   ├── user-account.dto.ts          # 帳號 DTO（註冊、登入、密碼）
│   └── find-all-query.dto.ts        # 查詢 DTO
├── entities/
│   └── user-account.entity.ts       # Entity 實體
├── user-account.controller.ts       # Controller 層
├── user-account.service.ts          # Service 層
├── user-account.module.ts           # Module 定義
└── user-account.interface.ts        # 介面定義（枚舉、常數）
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
│  - 路由定義與請求處理               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Service 層（業務邏輯）         │
│  - 帳號註冊與登入                   │
│  - 密碼加密與驗證                   │
│  - 業務規則驗證                     │
│  - 資料庫事務管理                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Prisma ORM（資料存取）         │
│  - SQL 查詢建構                     │
│  - 型別安全的資料庫操作             │
│  - 密碼雜湊處理 (bcrypt)            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    PostgreSQL 資料庫（資料儲存）    │
└─────────────────────────────────────┘
```

### 1.4 請求處理流程

```
HTTP Request
  ↓
[1] Controller 接收請求
  ├─> 路由匹配
  ├─> 參數驗證 (DTO + class-validator)
  └─> 身份認證（特定端點）
  ↓
[2] Service 業務邏輯處理
  ├─> 資料驗證
  ├─> 密碼加密/驗證 (bcrypt)
  ├─> 業務規則檢查
  ├─> Prisma ORM 操作
  └─> 資料轉換 (plainToInstance)
  ↓
[3] Controller 回應處理
  ├─> 包裝回應格式
  ├─> 設定 HTTP 狀態碼
  └─> Swagger 自動文件
  ↓
HTTP Response (JSON)
```

---

## 2. API 文件規範

### 2.1 API 基本資訊

| 項目         | 說明                                   |
| ------------ | -------------------------------------- |
| **基礎 URL** | `/api/user-account`                    |
| **協定**     | HTTP/HTTPS                             |
| **資料格式** | JSON                                   |
| **字元編碼** | UTF-8                                  |
| **認證方式** | 部分端點需要 JWT Token (Bearer)         |

### 2.2 API 端點清單

| HTTP Method | 端點路徑                           | 功能說明             | 認證 |
| ----------- | ---------------------------------- | -------------------- | ---- |
| POST        | /api/user-account/register         | 註冊新帳號           | ❌   |
| POST        | /api/user-account/login            | 帳號登入             | ❌   |
| PATCH       | /api/user-account/:id/password     | 修改密碼             | ✅   |
| PUT         | /api/user-account/:id/password     | 重設密碼（管理員）   | ✅   |
| GET         | /api/user-account                  | 查詢帳號列表         | ✅   |
| GET         | /api/user-account/:id              | 查詢單一帳號         | ✅   |
| DELETE      | /api/user-account/:id              | 刪除帳號（硬刪除）   | ✅   |

---

### 2.3 API 端點詳細規格

#### 2.3.1 註冊新帳號

**端點：** `POST /api/user-account/register`

**說明：** 建立新的使用者帳號，密碼將使用 bcrypt 加密後儲存。

**Request Headers：**

```typescript
{
  "Content-Type": "application/json"
}
```

**Request Body：**

```typescript
interface CreateUserAccountDto {
  /** 帳號 */
  account: string;
  /** 密碼（5-20 位字元） */
  password: string;
}
```

**Request 範例：**

```json
{
  "account": "user001",
  "password": "myPassword123"
}
```

**欄位說明：**

| 欄位路徑   | 類型   | 必填 | 說明                           | 驗證規則                     |
| ---------- | ------ | ---- | ------------------------------ | ---------------------------- |
| `account`  | string | ✅   | 使用者帳號                     | 不可為空字串                 |
| `password` | string | ✅   | 密碼                           | 長度 5-20 位，不可為空字串   |

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "id": 1,
  "type": "Local",
  "account": "user001",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "lastLoginAt": null
}
```

**失敗回應：**

**1. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "account should not be empty",
    "密碼長度需為5~20位"
  ],
  "error": "Bad Request"
}
```

**2. 帳號已存在 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "帳號已存在",
  "error": "Bad Request"
}
```

---

#### 2.3.2 帳號登入

**端點：** `POST /api/user-account/login`

**說明：** 使用帳號密碼進行登入驗證，成功後更新最後登入時間。

**Request Headers：**

```typescript
{
  "Content-Type": "application/json"
}
```

**Request Body：**

```typescript
interface LoginDto {
  /** 帳號 */
  account: string;
  /** 密碼 */
  password: string;
}
```

**Request 範例：**

```json
{
  "account": "user001",
  "password": "myPassword123"
}
```

**欄位說明：**

| 欄位路徑   | 類型   | 必填 | 說明           | 驗證規則         |
| ---------- | ------ | ---- | -------------- | ---------------- |
| `account`  | string | ✅   | 使用者帳號     | 不可為空字串     |
| `password` | string | ✅   | 密碼           | 不可為空字串     |

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "id": 1,
  "type": "Local",
  "account": "user001",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "lastLoginAt": "2025-11-17T08:30:00.000Z"
}
```

**失敗回應：**

**1. 帳號或密碼錯誤 (401 Unauthorized)：**

```json
{
  "statusCode": 401,
  "message": "帳號或密碼錯誤",
  "error": "Unauthorized"
}
```

**2. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "account should not be empty",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

---

#### 2.3.3 修改密碼

**端點：** `PATCH /api/user-account/:id/password`

**說明：** 使用者修改自己的密碼，需要提供舊密碼進行驗證。

**Path Parameters：**

| 參數名稱 | 類型   | 必填 | 說明         |
| -------- | ------ | ---- | ------------ |
| `id`     | number | ✅   | 使用者帳號 ID |

**Request Headers：**

```typescript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body：**

```typescript
interface UpdatePasswordDto {
  /** 舊密碼 */
  oldPassword: string;
  /** 新密碼（5-20 位字元） */
  newPassword: string;
}
```

**Request 範例：**

```json
{
  "oldPassword": "myPassword123",
  "newPassword": "newPassword456"
}
```

**欄位說明：**

| 欄位路徑      | 類型   | 必填 | 說明                           | 驗證規則                     |
| ------------- | ------ | ---- | ------------------------------ | ---------------------------- |
| `oldPassword` | string | ✅   | 舊密碼                         | 不可為空字串                 |
| `newPassword` | string | ✅   | 新密碼                         | 長度 5-20 位，不可為空字串，不可與舊密碼相同 |

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "id": 1,
  "type": "Local",
  "account": "user001",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "lastLoginAt": "2025-11-17T08:30:00.000Z"
}
```

**失敗回應：**

**1. 帳號不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此帳號",
  "error": "Not Found"
}
```

**2. 舊密碼錯誤 (401 Unauthorized)：**

```json
{
  "statusCode": 401,
  "message": "舊密碼錯誤",
  "error": "Unauthorized"
}
```

**3. 新舊密碼相同 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "舊密碼不可與新密碼一致"
  ],
  "error": "Bad Request"
}
```

**4. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "密碼長度需為5~20位"
  ],
  "error": "Bad Request"
}
```

---

#### 2.3.4 重設密碼

**端點：** `PUT /api/user-account/:id/password`

**說明：** 管理員重設使用者密碼，不需要提供舊密碼。

**Path Parameters：**

| 參數名稱 | 類型   | 必填 | 說明         |
| -------- | ------ | ---- | ------------ |
| `id`     | number | ✅   | 使用者帳號 ID |

**Request Headers：**

```typescript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body：**

```typescript
interface ResetPasswordDto {
  /** 新密碼（5-20 位字元） */
  newPassword: string;
}
```

**Request 範例：**

```json
{
  "newPassword": "resetPassword789"
}
```

**欄位說明：**

| 欄位路徑      | 類型   | 必填 | 說明                           | 驗證規則                     |
| ------------- | ------ | ---- | ------------------------------ | ---------------------------- |
| `newPassword` | string | ✅   | 新密碼                         | 長度 5-20 位，不可為空字串   |

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "id": 1,
  "type": "Local",
  "account": "user001",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "lastLoginAt": "2025-11-17T08:30:00.000Z"
}
```

**失敗回應：**

**1. 帳號不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此帳號",
  "error": "Not Found"
}
```

**2. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": [
    "密碼長度需為5~20位"
  ],
  "error": "Bad Request"
}
```

---

#### 2.3.5 查詢帳號列表

**端點：** `GET /api/user-account`

**說明：** 查詢使用者帳號列表，支援分頁和 ID 篩選。

**Query Parameters：**

| 參數名稱 | 類型     | 必填 | 預設值 | 說明                                       |
| -------- | -------- | ---- | ------ | ------------------------------------------ |
| `page`   | number   | ❌   | 1      | 頁碼                                       |
| `limit`  | number   | ❌   | 10     | 每頁筆數（最大 100）                       |
| `ids`    | number[] | ❌   | -      | 篩選特定 ID 的帳號，多個 ID 用逗號分隔     |

**Request Headers：**

```typescript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request 範例：**

```bash
GET /api/user-account?page=1&limit=10&ids=1,2,3
Authorization: Bearer <JWT_TOKEN>
```

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "data": [
    {
      "id": 1,
      "type": "Local",
      "account": "user001",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "lastLoginAt": "2025-11-17T08:30:00.000Z"
    },
    {
      "id": 2,
      "type": "Google",
      "account": "user002@gmail.com",
      "createdAt": "2025-11-16T00:00:00.000Z",
      "lastLoginAt": "2025-11-17T07:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Response 欄位說明：**

| 欄位路徑            | 類型     | 說明                   |
| ------------------- | -------- | ---------------------- |
| `data`              | array    | 帳號資料陣列           |
| `data[].id`         | number   | 帳號 ID                |
| `data[].type`       | string   | 帳號類型（Local/Google/Line/Apple） |
| `data[].account`    | string   | 帳號名稱               |
| `data[].createdAt`  | string   | 建立時間 (ISO 8601)    |
| `data[].lastLoginAt`| string   | 最後登入時間 (ISO 8601) |
| `meta.total`        | number   | 總筆數                 |
| `meta.page`         | number   | 當前頁碼               |
| `meta.limit`        | number   | 每頁筆數               |
| `meta.totalPages`   | number   | 總頁數                 |

---

#### 2.3.6 查詢單一帳號

**端點：** `GET /api/user-account/:id`

**說明：** 根據 ID 查詢單一使用者帳號的詳細資訊。

**Path Parameters：**

| 參數名稱 | 類型   | 必填 | 說明         |
| -------- | ------ | ---- | ------------ |
| `id`     | number | ✅   | 使用者帳號 ID |

**Request Headers：**

```typescript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request 範例：**

```bash
GET /api/user-account/1
Authorization: Bearer <JWT_TOKEN>
```

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "id": 1,
  "type": "Local",
  "account": "user001",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "lastLoginAt": "2025-11-17T08:30:00.000Z"
}
```

**失敗回應：**

**1. ID 格式錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

**2. 帳號不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此帳號",
  "error": "Not Found"
}
```

---

#### 2.3.7 刪除帳號

**端點：** `DELETE /api/user-account/:id`

**說明：** 刪除使用者帳號（硬刪除），同時會刪除關聯的角色和權限資料。

**Path Parameters：**

| 參數名稱 | 類型   | 必填 | 說明         |
| -------- | ------ | ---- | ------------ |
| `id`     | number | ✅   | 使用者帳號 ID |

**Request Headers：**

```typescript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request 範例：**

```bash
DELETE /api/user-account/1
Authorization: Bearer <JWT_TOKEN>
```

**Response 回應：**

**成功回應 (204 No Content)：**

無回應內容。

**失敗回應：**

**1. 帳號不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此帳號",
  "error": "Not Found"
}
```

**2. 關聯資料衝突 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "此帳號有關聯資料，無法刪除",
  "error": "Bad Request"
}
```

---

### 2.4 HTTP 狀態碼對照表

| 狀態碼 | 說明                 | 使用情境                             |
| ------ | -------------------- | ------------------------------------ |
| 200    | OK                   | 查詢、註冊、登入、密碼操作成功       |
| 204    | No Content           | 刪除成功（無回應內容）               |
| 400    | Bad Request          | 參數驗證失敗、業務規則違反           |
| 401    | Unauthorized         | 未提供認證 Token、密碼錯誤           |
| 403    | Forbidden            | 沒有執行此操作的權限                 |
| 404    | Not Found            | 帳號不存在                           |
| 500    | Internal Server Error| 伺服器內部錯誤                       |

---

## 3. 資料結構定義

### 3.1 資料庫 Schema

**Prisma Schema 定義：**

```prisma
model UserAccount {
  id          Int       @id @default(autoincrement())
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  /// 帳號類型（Local, Google, Line, Apple）
  type        String

  /// 帳號名稱
  account     String

  /// 密碼（bcrypt 雜湊）
  password    String    @default("")

  /// 最後登入時間
  lastLoginAt DateTime? @map("last_login_at")

  verifications            Verification[]
  sendSmsLogs              SendSmsLog[]
  sendMailLogs             SendMailLog[]
  userAccountHasRole       UserAccountHasRole[]
  userAccountHasPermission UserAccountHasPermission[]
  user                     User[]
  verifyToken              VerifyToken[]

  @@map("user_account")
}
```

**資料表結構：**

| 欄位名稱        | 資料類型             | 限制條件           | 說明                         |
| --------------- | -------------------- | ------------------ | ---------------------------- |
| `id`            | INTEGER              | PRIMARY KEY, AUTO  | 主鍵 ID，自動遞增            |
| `created_at`    | TIMESTAMPTZ(3)       | NOT NULL, DEFAULT  | 建立時間，預設為當前時間     |
| `updated_at`    | TIMESTAMPTZ(3)       | NOT NULL           | 更新時間，自動更新           |
| `type`          | VARCHAR              | NOT NULL           | 帳號類型（Local/Google/Line/Apple） |
| `account`       | VARCHAR              | NOT NULL           | 帳號名稱                     |
| `password`      | VARCHAR              | NOT NULL, DEFAULT  | 密碼（bcrypt 雜湊），預設空字串 |
| `last_login_at` | TIMESTAMPTZ(3)       | NULL               | 最後登入時間，NULL 表示未登入 |

**索引建議：**

```sql
-- 提升帳號查詢效能（唯一性）
CREATE UNIQUE INDEX idx_user_account_account_type
ON user_account(account, type);

-- 提升最後登入時間查詢效能
CREATE INDEX idx_user_account_last_login_at
ON user_account(last_login_at);
```

---

### 3.2 Entity 定義

**UserAccountEntity：**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { AccountType } from '../user-account.interface';

@Exclude()
export class UserAccountEntity {
  /** 主鍵 ID */
  @ApiProperty({ description: '主鍵 ID', example: 1 })
  @Expose()
  id!: number;

  /** 帳號類型 */
  @ApiProperty({
    description: '帳號類型',
    enum: AccountType,
    example: AccountType.Local
  })
  @Expose()
  type!: AccountType;

  /** 帳號 */
  @ApiProperty({ description: '帳號', example: 'user001' })
  @Expose()
  account!: string;

  /** 建立時間 */
  @ApiProperty({
    description: '建立時間',
    example: '2025-11-17T00:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  /** 最後登入時間 */
  @ApiProperty({
    description: '最後登入時間',
    example: '2025-11-17T08:30:00.000Z',
    required: false,
  })
  @Expose()
  lastLoginAt?: Date;
}
```

**欄位說明：**

- 使用 `@Exclude()` 裝飾器預設排除所有欄位
- 使用 `@Expose()` 裝飾器明確指定要暴露的欄位
- `password` 欄位不使用 `@Expose()`，因此不會出現在 API 回應中（安全性考量）
- 所有公開欄位都使用 `@ApiProperty` 提供 Swagger 文件

---

### 3.3 DTO 定義

#### 3.3.1 CreateUserAccountDto（註冊）

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserAccountDto {
  /** 帳號 */
  @ApiProperty({ description: '帳號', example: 'user001' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  /** 密碼 */
  @ApiProperty({ description: '密碼', example: 'myPassword123' })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20, { message: '密碼長度需為5~20位' })
  password!: string;
}
```

**驗證規則：**

| 欄位       | 驗證器           | 說明                 |
| ---------- | ---------------- | -------------------- |
| `account`  | `@IsNotEmpty()`  | 不可為空             |
| `account`  | `@IsString()`    | 必須為字串型別       |
| `password` | `@IsNotEmpty()`  | 不可為空             |
| `password` | `@IsString()`    | 必須為字串型別       |
| `password` | `@Length(5, 20)` | 長度必須為 5-20 位   |

---

#### 3.3.2 LoginDto（登入）

```typescript
import { PickType } from '@nestjs/swagger';
import { CreateUserAccountDto } from './create-user-account.dto';

export class LoginDto extends PickType(CreateUserAccountDto, [
  'account',
  'password',
] as const) {}
```

**說明：**

- 使用 `PickType` 從 `CreateUserAccountDto` 選取 `account` 和 `password` 欄位
- 等同於：

```typescript
export class LoginDto {
  @ApiProperty({ description: '帳號', example: 'user001' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ description: '密碼', example: 'myPassword123' })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20, { message: '密碼長度需為5~20位' })
  password!: string;
}
```

---

#### 3.3.3 UpdatePasswordDto（修改密碼）

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString, Length, ValidateIf } from 'class-validator';

export class UpdatePasswordDto {
  /** 舊密碼 */
  @ApiProperty({ description: '舊密碼', example: 'oldPassword123' })
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  /** 新密碼 */
  @ApiProperty({ description: '新密碼', example: 'newPassword456' })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20, { message: '密碼長度需為5~20位' })
  newPassword!: string;

  /** 驗證舊密碼不可與新密碼相同 */
  @ValidateIf((o) => o.oldPassword === o.newPassword)
  @IsDefined({ message: '舊密碼不可與新密碼一致' })
  protected readonly samePassword: undefined;
}
```

**驗證規則：**

| 欄位           | 驗證器           | 說明                               |
| -------------- | ---------------- | ---------------------------------- |
| `oldPassword`  | `@IsNotEmpty()`  | 不可為空                           |
| `oldPassword`  | `@IsString()`    | 必須為字串型別                     |
| `newPassword`  | `@IsNotEmpty()`  | 不可為空                           |
| `newPassword`  | `@IsString()`    | 必須為字串型別                     |
| `newPassword`  | `@Length(5, 20)` | 長度必須為 5-20 位                 |
| `samePassword` | `@ValidateIf()`  | 當舊密碼與新密碼相同時觸發驗證錯誤 |

---

#### 3.3.4 ResetPasswordDto（重設密碼）

```typescript
import { PickType } from '@nestjs/swagger';
import { UpdatePasswordDto } from './update-password.dto';

export class ResetPasswordDto extends PickType(UpdatePasswordDto, [
  'newPassword',
] as const) {}
```

**說明：**

- 使用 `PickType` 從 `UpdatePasswordDto` 選取 `newPassword` 欄位
- 管理員重設密碼不需要提供舊密碼

---

#### 3.3.5 FindAllQueryDto（查詢列表）

```typescript
import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';
import { IntIdsQuery } from 'src/_libs/api-request/query.decorator';
import { entityName } from '../user-account.interface';

export class FindAllQueryDto extends PaginationQueryDto {
  /** 篩選特定 ID 的帳號 */
  @IntIdsQuery(entityName)
  ids?: number[];
}
```

**繼承的欄位（來自 PaginationQueryDto）：**

| 欄位    | 類型   | 必填 | 預設值 | 說明         |
| ------- | ------ | ---- | ------ | ------------ |
| `page`  | number | ❌   | 1      | 頁碼         |
| `limit` | number | ❌   | 10     | 每頁筆數     |

**擴充欄位：**

| 欄位  | 類型     | 必填 | 說明                           |
| ----- | -------- | ---- | ------------------------------ |
| `ids` | number[] | ❌   | 篩選特定 ID，多個 ID 用逗號分隔 |

---

### 3.4 Enum 定義

#### 3.4.1 AccountType（帳號類型）

```typescript
export enum AccountType {
  /** 本地帳號 */
  Local = 'Local',
  /** Google 帳號 */
  Google = 'Google',
  /** Line 帳號 */
  Line = 'Line',
  /** Apple 帳號 */
  Apple = 'Apple',
}
```

**枚舉值說明：**

| 枚舉值   | 說明                                   |
| -------- | -------------------------------------- |
| `Local`  | 本地註冊帳號，使用帳號密碼登入         |
| `Google` | 透過 Google OAuth 登入的帳號           |
| `Line`   | 透過 Line OAuth 登入的帳號             |
| `Apple`  | 透過 Apple Sign-In 登入的帳號          |

---

### 3.5 資料關聯圖

```
UserAccount (使用者帳號)
  │
  ├─ 1:N ─> Verification (驗證記錄)
  ├─ 1:N ─> SendSmsLog (簡訊發送紀錄)
  ├─ 1:N ─> SendMailLog (郵件發送紀錄)
  ├─ 1:N ─> UserAccountHasRole (帳號角色關聯)
  ├─ 1:N ─> UserAccountHasPermission (帳號權限關聯)
  ├─ 1:N ─> User (使用者資料)
  └─ 1:N ─> VerifyToken (驗證令牌)
```

**關聯說明：**

- 一個使用者帳號可以有多筆驗證記錄、簡訊/郵件發送紀錄（1:N）
- 一個使用者帳號可以關聯多個角色和權限（1:N，透過中介表）
- 一個使用者帳號可以關聯多個使用者資料（1:N）
- 刪除帳號時，關聯的角色和權限會自動刪除（CASCADE）

---

## 4. 業務邏輯設計

### 4.1 Service 層設計

**UserAccountService 類別結構：**

```typescript
@Injectable()
export class UserAccountService {
  // 依賴注入
  constructor(private readonly prisma: PrismaService) {}

  // **********
  // Write Operations
  // **********

  /** 註冊新帳號 */
  async create(dto: CreateUserAccountDto): Promise<UserAccountEntity>

  /** 帳號登入 */
  async login(dto: LoginDto): Promise<UserAccountEntity>

  /** 修改密碼 */
  async updatePassword(id: number, dto: UpdatePasswordDto): Promise<UserAccountEntity>

  /** 重設密碼 */
  async resetPassword(id: number, dto: ResetPasswordDto): Promise<UserAccountEntity>

  /** 刪除帳號（硬刪除） */
  async remove(id: number): Promise<void>

  // **********
  // Read Operations
  // **********

  /** 查詢列表（分頁） */
  async findAll(query: FindAllQueryDto): Promise<{ data: UserAccountEntity[]; meta: any }>

  /** 查詢單一帳號 */
  async findOne(id: number): Promise<UserAccountEntity>

  /** 根據帳號名稱查詢 */
  async findByAccount(account: string): Promise<UserAccountEntity>

  /** 檢查帳號是否存在 */
  async existsByAccount(account: string): Promise<boolean>
}
```

---

### 4.2 核心業務邏輯

#### 4.2.1 註冊帳號邏輯

```typescript
async create(dto: CreateUserAccountDto) {
  try {
    const { account, password: rawPw } = dto;

    // 1. 使用 bcrypt 對密碼進行雜湊加密（salt rounds = 10）
    const password = await bcrypt.hash(rawPw, 10);

    // 2. 建立帳號記錄，帳號類型預設為 Local
    const userAccount = await this.prisma.userAccount.create({
      data: {
        type: AccountType.Local,
        account,
        password
      },
    });

    // 3. 轉換為 Entity 並返回（不包含密碼欄位）
    return plainToInstance(UserAccountEntity, userAccount);
  } catch (err) {
    // 4. 處理 Prisma 錯誤（如帳號重複）
    dealWithPrismaClientError(err, entityName);
    throw err;
  }
}
```

**流程說明：**

1. 解構 DTO，取得帳號和原始密碼
2. 使用 `bcrypt.hash()` 對密碼進行加密（salt rounds = 10）
3. 建立帳號記錄，帳號類型預設為 `Local`
4. 使用 `plainToInstance` 轉換 ORM 物件為 Entity（自動排除密碼欄位）
5. 捕獲並處理 Prisma 錯誤（如唯一性約束違反）

**安全性考量：**

- 密碼使用 bcrypt 進行雜湊加密，無法反向解密
- bcrypt salt rounds 設定為 10，平衡安全性與效能
- 密碼欄位不會出現在 API 回應中

---

#### 4.2.2 登入邏輯

```typescript
async login(dto: LoginDto) {
  const { account, password } = dto;

  // 1. 查詢帳號（僅限 Local 類型）
  let userAccount = await this.prisma.userAccount.findFirst({
    where: { account, type: AccountType.Local },
  });
  abortIf(!userAccount, loginErrMsg, HttpStatus.UNAUTHORIZED);

  // 2. 驗證密碼（使用 bcrypt.compare）
  const valid = await bcrypt.compare(password, userAccount!.password);
  abortIf(!valid, loginErrMsg, HttpStatus.UNAUTHORIZED);

  // 3. 更新最後登入時間
  userAccount = await this.prisma.userAccount.update({
    where: { id: userAccount!.id },
    data: { lastLoginAt: new Date() },
  });

  // 4. 轉換為 Entity 並返回
  return plainToInstance(UserAccountEntity, userAccount);
}
```

**流程說明：**

1. 根據帳號和類型（Local）查詢帳號記錄
2. 如果帳號不存在，返回 401 錯誤（統一錯誤訊息，避免洩漏帳號資訊）
3. 使用 `bcrypt.compare()` 驗證密碼
4. 如果密碼錯誤，返回 401 錯誤（統一錯誤訊息）
5. 密碼正確，更新最後登入時間
6. 轉換為 Entity 並返回

**安全性考量：**

- 帳號不存在和密碼錯誤使用相同的錯誤訊息，防止帳號枚舉攻擊
- 使用 `bcrypt.compare()` 進行密碼驗證，安全可靠
- 僅限 Local 類型帳號登入，其他類型需使用對應的 OAuth 流程

---

#### 4.2.3 修改密碼邏輯

```typescript
async updatePassword(id: number, dto: UpdatePasswordDto) {
  // 1. 驗證帳號存在
  let userAccount = await this.prisma.userAccount.findFirst({
    where: { id },
  });
  abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);

  // 2. 驗證舊密碼
  const { oldPassword, newPassword } = dto;
  const valid = await bcrypt.compare(oldPassword, userAccount!.password);
  abortIf(!valid, '舊密碼錯誤', HttpStatus.UNAUTHORIZED);

  // 3. 加密新密碼
  const password = await bcrypt.hash(newPassword, 10);

  // 4. 更新密碼
  userAccount = await this.prisma.userAccount.update({
    where: { id: userAccount!.id },
    data: { password },
  });

  // 5. 轉換為 Entity 並返回
  return plainToInstance(UserAccountEntity, userAccount);
}
```

**流程說明：**

1. 驗證帳號存在，如不存在返回 404 錯誤
2. 使用 `bcrypt.compare()` 驗證舊密碼
3. 如果舊密碼錯誤，返回 401 錯誤
4. 使用 `bcrypt.hash()` 加密新密碼
5. 更新密碼欄位
6. 轉換為 Entity 並返回

**安全性考量：**

- 必須提供正確的舊密碼才能修改
- 新密碼同樣使用 bcrypt 加密
- DTO 層已驗證新舊密碼不可相同

---

#### 4.2.4 重設密碼邏輯

```typescript
async resetPassword(id: number, dto: ResetPasswordDto) {
  // 1. 驗證帳號存在
  let userAccount = await this.prisma.userAccount.findFirst({
    where: { id },
  });
  abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);

  // 2. 加密新密碼
  const { newPassword } = dto;
  const password = await bcrypt.hash(newPassword, 10);

  // 3. 更新密碼
  userAccount = await this.prisma.userAccount.update({
    where: { id: userAccount!.id },
    data: { password },
  });

  // 4. 轉換為 Entity 並返回
  return plainToInstance(UserAccountEntity, userAccount);
}
```

**流程說明：**

1. 驗證帳號存在，如不存在返回 404 錯誤
2. 使用 `bcrypt.hash()` 加密新密碼
3. 更新密碼欄位（不需要驗證舊密碼）
4. 轉換為 Entity 並返回

**使用場景：**

- 管理員重設使用者密碼
- 忘記密碼後的密碼重設（需搭配驗證流程）

**安全性考量：**

- 此端點應限制管理員權限使用
- 建議搭配雙因素驗證或郵件/簡訊驗證

---

#### 4.2.5 查詢列表邏輯

```typescript
async findAll(query: FindAllQueryDto) {
  const { page, limit, ids } = query;

  // 1. 建構 WHERE 條件
  const where: Prisma.UserAccountWhereInput = {};
  if (ids?.length) where.id = { in: ids };

  // 2. 執行分頁查詢
  const { result, ...meta } = await this.prisma.userAccount.pagination({
    page,
    limit,
    where,
    orderBy: { id: 'asc' },
  });

  // 3. 轉換並返回
  return {
    data: plainToInstance(UserAccountEntity, result),
    meta,
  };
}
```

**流程說明：**

1. 建構查詢條件，支援 ID 篩選
2. 使用 Prisma 的 `pagination` 方法執行分頁查詢
3. 預設按 ID 升序排序
4. 轉換為 Entity 並返回（包含分頁元資料）

**查詢優化：**

- 使用 Prisma 內建的 `pagination` 方法，自動處理分頁邏輯
- 支援 ID 批次查詢，減少多次請求

---

#### 4.2.6 刪除帳號邏輯

```typescript
async remove(id: number) {
  try {
    return await this.prisma.userAccount.delete({
      where: { id },
    });
  } catch (err) {
    dealWithPrismaClientError(err, entityName);
    throw err;
  }
}
```

**流程說明：**

1. 執行硬刪除操作
2. 捕獲並處理 Prisma 錯誤（如記錄不存在、外鍵約束）

**注意事項：**

- 此為硬刪除，資料將永久移除
- 關聯的角色和權限會自動刪除（CASCADE）
- 如有其他關聯資料（如使用者資料），可能導致刪除失敗

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
  │   └─> abortIf() 工具函數
  │       ├─> 檢查條件
  │       ├─> 拋出 HttpException
  │       └─> 適當的 HTTP 狀態碼
  │
  └─> 其他錯誤
      └─> NestJS ExceptionFilter
          └─> 返回 500 Internal Server Error
```

### 5.2 錯誤代碼對照表

| 錯誤代碼 | HTTP 狀態 | 錯誤訊息                 | 觸發情境                   | 處理建議                 |
| -------- | --------- | ------------------------ | -------------------------- | ------------------------ |
| E001     | 400       | 帳號已存在               | 註冊時帳號重複             | 更換帳號名稱             |
| E002     | 401       | 帳號或密碼錯誤           | 登入時帳號或密碼不正確     | 確認帳號密碼後重試       |
| E003     | 401       | 舊密碼錯誤               | 修改密碼時舊密碼不正確     | 確認舊密碼後重試         |
| E004     | 404       | 無此帳號                 | 查詢或操作不存在的帳號     | 確認帳號 ID 是否正確     |
| E005     | 400       | 密碼長度需為5~20位       | 密碼長度不符合要求         | 調整密碼長度             |
| E006     | 400       | 舊密碼不可與新密碼一致   | 修改密碼時新舊密碼相同     | 使用不同的新密碼         |
| E007     | 400       | 此帳號有關聯資料，無法刪除 | 刪除帳號時有關聯資料       | 先處理關聯資料後再刪除   |

### 5.3 Prisma 錯誤處理

**常見 Prisma 錯誤代碼：**

| 錯誤代碼 | 說明                 | HTTP 狀態碼 | 處理方式                   |
| -------- | -------------------- | ----------- | -------------------------- |
| P2002    | 唯一性約束違反       | 400         | 返回「帳號已存在」錯誤     |
| P2025    | 記錄不存在           | 404         | 返回「無此帳號」錯誤       |
| P2003    | 外鍵約束違反         | 400         | 返回「關聯資料錯誤」       |
| P2014    | 關聯違反             | 400         | 返回「資料關聯衝突」       |

**dealWithPrismaClientError 使用範例：**

```typescript
try {
  const userAccount = await this.prisma.userAccount.create({
    data: { type: AccountType.Local, account, password },
  });
  return plainToInstance(UserAccountEntity, userAccount);
} catch (err) {
  dealWithPrismaClientError(err, entityName);
  throw err;
}
```

---

### 5.4 驗證錯誤處理

**class-validator 自動驗證：**

```typescript
// DTO 定義
export class CreateUserAccountDto {
  @ApiProperty({ description: '帳號' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ description: '密碼' })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20, { message: '密碼長度需為5~20位' })
  password!: string;
}
```

**錯誤回應格式：**

```json
{
  "statusCode": 400,
  "message": [
    "account should not be empty",
    "密碼長度需為5~20位"
  ],
  "error": "Bad Request"
}
```

---

### 5.5 業務邏輯錯誤

**使用 abortIf 工具函數：**

```typescript
// 檢查帳號是否存在
abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);

// 檢查密碼是否正確
abortIf(!valid, '舊密碼錯誤', HttpStatus.UNAUTHORIZED);
```

**錯誤回應格式：**

```json
{
  "statusCode": 401,
  "message": "舊密碼錯誤",
  "error": "Unauthorized"
}
```

---

### 5.6 錯誤回應格式統一

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
  "statusCode": 404,
  "message": "無此帳號",
  "error": "Not Found"
}
```

---

## 6. 安全性設計

### 6.1 密碼加密

**bcrypt 雜湊加密：**

```typescript
// 註冊時加密密碼
const password = await bcrypt.hash(rawPw, 10);

// 登入時驗證密碼
const valid = await bcrypt.compare(password, userAccount.password);
```

**bcrypt 特性：**

- **單向雜湊**：無法從雜湊值反推原始密碼
- **自動加鹽**：每次雜湊產生不同的結果，防止彩虹表攻擊
- **可調整難度**：salt rounds = 10，平衡安全性與效能
- **抗暴力破解**：計算成本高，減緩暴力破解速度

**密碼儲存安全性：**

```
原始密碼: "myPassword123"
↓ bcrypt.hash(rawPw, 10)
雜湊值: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
↓ 儲存至資料庫
永久儲存的雜湊值（無法反推原始密碼）
```

---

### 6.2 密碼驗證流程

```
使用者登入
  │
  ├─> 輸入帳號密碼
  │
  ↓
查詢帳號
  │
  ├─> 帳號不存在？返回「帳號或密碼錯誤」（防止帳號枚舉）
  │
  ↓
bcrypt.compare(inputPassword, storedHash)
  │
  ├─> 密碼錯誤？返回「帳號或密碼錯誤」
  │
  ↓
驗證成功
  │
  ├─> 更新最後登入時間
  │
  ↓
返回帳號資訊（不包含密碼）
```

---

### 6.3 身份認證

**JWT Token 認證流程：**

```
客戶端請求
  │
  ├─> Header: Authorization: Bearer <JWT_TOKEN>
  │
  ↓
NestJS Guard (@UseGuards(JwtAuthGuard))
  │
  ├─> 驗證 Token 簽名
  ├─> 檢查 Token 是否過期
  ├─> 解析 Token Payload
  │   └─> { userId, email, role, ... }
  │
  ├─> Token 有效：
  │   ├─> 注入 User 資訊到 Request
  │   └─> 繼續處理請求
  │
  └─> Token 無效：
      └─> 返回 401 Unauthorized
```

**Controller 層應用：**

```typescript
@ApiTags('帳號管理')
@Controller('user-account')
export class UserAccountController {
  // 公開端點（無需認證）
  @Post('register')
  create(@Body() dto: CreateUserAccountDto) {
    return this.userAccountService.create(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.userAccountService.login(dto);
  }

  // 需要認證的端點
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userAccountService.findOne(id);
  }
}
```

---

### 6.4 權限控制

**基於角色的存取控制（RBAC）：**

```typescript
@ApiTags('帳號管理')
@Controller('user-account')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserAccountController {

  // 僅管理員可刪除帳號
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userAccountService.remove(id);
  }

  // 僅管理員可重設密碼
  @Roles('admin')
  @Put(':id/password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userAccountService.resetPassword(id, dto);
  }
}
```

**權限等級建議：**

| 操作       | 最低權限等級 | 說明                   |
| ---------- | ------------ | ---------------------- |
| 註冊       | Public       | 公開端點               |
| 登入       | Public       | 公開端點               |
| 查詢列表   | User         | 所有認證使用者         |
| 查詢單一   | User         | 僅可查詢自己的帳號     |
| 修改密碼   | User         | 僅可修改自己的密碼     |
| 重設密碼   | Admin        | 僅系統管理員           |
| 刪除帳號   | Admin        | 僅系統管理員           |

---

### 6.5 輸入驗證

**多層驗證機制：**

1. **DTO 驗證（class-validator）**
   - 型別驗證
   - 必填檢查
   - 格式驗證（長度、格式等）

2. **參數驗證（Pipe）**
   - `ParseIntPipe`：路徑參數轉換和驗證
   - `ValidationPipe`：自動驗證 DTO

3. **業務邏輯驗證（Service 層）**
   - 帳號唯一性檢查
   - 密碼複雜度檢查
   - 業務規則驗證

**防止 SQL Injection：**

- 使用 Prisma ORM，自動防止 SQL Injection
- 所有查詢參數都經過型別檢查和轉換

**防止 XSS：**

- 輸入資料驗證和清理
- 輸出時使用 JSON 格式，自動轉義特殊字元

---

### 6.6 防止帳號枚舉攻擊

**統一錯誤訊息：**

```typescript
// ❌ 錯誤：洩漏帳號存在性
if (!userAccount) {
  throw new HttpException('帳號不存在', HttpStatus.NOT_FOUND);
}
if (!valid) {
  throw new HttpException('密碼錯誤', HttpStatus.UNAUTHORIZED);
}

// ✅ 正確：統一錯誤訊息
const loginErrMsg = '帳號或密碼錯誤';
abortIf(!userAccount, loginErrMsg, HttpStatus.UNAUTHORIZED);
abortIf(!valid, loginErrMsg, HttpStatus.UNAUTHORIZED);
```

**安全性考量：**

- 帳號不存在和密碼錯誤使用相同的錯誤訊息
- 防止攻擊者透過錯誤訊息枚舉有效帳號
- 兩種情況都返回 401 Unauthorized

---

### 6.7 HTTPS 傳輸

**強制使用 HTTPS：**

- 所有 API 呼叫必須使用 HTTPS
- 在 Nginx/Load Balancer 層強制重導向
- 保護密碼和敏感資料傳輸

---

## 7. 效能考量

### 7.1 資料庫效能優化

**索引策略：**

```sql
-- 帳號查詢索引（唯一性）
CREATE UNIQUE INDEX idx_user_account_account_type
ON user_account(account, type);

-- 最後登入時間索引
CREATE INDEX idx_user_account_last_login_at
ON user_account(last_login_at);

-- ID 查詢索引（主鍵自動建立）
-- CREATE INDEX idx_user_account_id ON user_account(id);
```

**查詢優化：**

- 使用 Prisma 的 `pagination` 方法，自動優化分頁查詢
- 使用複合索引（account, type）提升登入查詢效能
- 限制單次查詢筆數（最大 100 筆）

---

### 7.2 密碼加密效能

**bcrypt 效能考量：**

```typescript
// salt rounds = 10（建議值）
// 單次加密時間約 100-200ms
const password = await bcrypt.hash(rawPw, 10);

// 驗證時間與加密時間相近
const valid = await bcrypt.compare(password, userAccount.password);
```

**效能與安全性平衡：**

| Salt Rounds | 加密時間   | 安全性 | 建議使用場景         |
| ----------- | ---------- | ------ | -------------------- |
| 8           | 50ms       | 中     | 開發環境             |
| 10          | 100-200ms  | 高     | 生產環境（建議）     |
| 12          | 400-800ms  | 極高   | 高安全性需求         |

**優化建議：**

- 生產環境使用 salt rounds = 10
- 如需更高安全性，可調整至 12（需評估效能影響）
- 密碼加密為 CPU 密集操作，考慮使用專用服務

---

### 7.3 快取策略（選用）

**Redis 快取建議：**

```typescript
// 快取帳號資訊（5 分鐘）
const cacheKey = `user-account:${id}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await this.service.findOne(id);
await redis.setex(cacheKey, 300, JSON.stringify(result));

return result;
```

**快取失效策略：**

- 註冊、更新、刪除帳號時，清除相關快取
- 使用 Redis Key Pattern 批量清除：`user-account:*`
- 敏感操作（如密碼修改）不使用快取

---

### 7.4 連線池設定

**Prisma 連線池配置：**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // 連線池設定
  connection_limit = 20
  pool_timeout = 10
}
```

**建議設定：**

- `connection_limit`: 10-20（依據伺服器資源調整）
- `pool_timeout`: 10 秒

---

### 7.5 回應壓縮

**啟用 GZIP 壓縮：**

```typescript
// main.ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 啟用壓縮
  app.use(compression());

  await app.listen(3000);
}
```

**效果：**

- 減少網路傳輸資料量
- 提升 API 回應速度（特別是列表查詢）

---

## 8. 範例代碼

### 8.1 前端整合範例（TypeScript）

**註冊帳號：**

```typescript
import axios from 'axios';

interface CreateUserAccountDto {
  account: string;
  password: string;
}

interface UserAccountEntity {
  id: number;
  type: string;
  account: string;
  createdAt: string;
  lastLoginAt?: string;
}

async function register(
  data: CreateUserAccountDto,
): Promise<UserAccountEntity> {
  const response = await axios.post(
    '/api/user-account/register',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}

// 使用範例
const result = await register({
  account: 'user001',
  password: 'myPassword123',
});

console.log('註冊成功:', result);
// 輸出: 註冊成功: { id: 1, type: 'Local', account: 'user001', ... }
```

---

**登入：**

```typescript
interface LoginDto {
  account: string;
  password: string;
}

async function login(
  data: LoginDto,
): Promise<UserAccountEntity> {
  const response = await axios.post(
    '/api/user-account/login',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}

// 使用範例（含錯誤處理）
try {
  const result = await login({
    account: 'user001',
    password: 'myPassword123',
  });

  console.log('登入成功:', result);
  // 儲存 JWT Token（假設有返回）
  // localStorage.setItem('token', result.token);
} catch (error) {
  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 401) {
      console.error('登入失敗:', error.response.data.message);
      // 輸出: 登入失敗: 帳號或密碼錯誤
    }
  }
}
```

---

**修改密碼：**

```typescript
interface UpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
}

async function updatePassword(
  token: string,
  id: number,
  data: UpdatePasswordDto,
): Promise<UserAccountEntity> {
  const response = await axios.patch(
    `/api/user-account/${id}/password`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}

// 使用範例
const updated = await updatePassword(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  1,
  {
    oldPassword: 'myPassword123',
    newPassword: 'newPassword456',
  },
);

console.log('密碼修改成功:', updated);
```

---

**查詢列表：**

```typescript
interface FindAllQuery {
  page?: number;
  limit?: number;
  ids?: number[];
}

interface ResourceListEntity<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function getUserAccounts(
  token: string,
  query: FindAllQuery = {},
): Promise<ResourceListEntity<UserAccountEntity>> {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.ids) params.append('ids', query.ids.join(','));

  const response = await axios.get(
    `/api/user-account?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

// 使用範例
const result = await getUserAccounts(token, {
  page: 1,
  limit: 10,
  ids: [1, 2, 3],
});

console.log(`共 ${result.meta.total} 筆帳號`);
result.data.forEach(account => {
  console.log(`- ${account.account} (${account.type})`);
});
```

---

**刪除帳號：**

```typescript
async function deleteUserAccount(
  token: string,
  id: number,
): Promise<void> {
  await axios.delete(
    `/api/user-account/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  console.log('刪除成功');
}

// 使用範例（含錯誤處理）
try {
  await deleteUserAccount(token, 1);
} catch (error) {
  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 400) {
      console.error('無法刪除:', error.response.data.message);
      // 輸出: 無法刪除: 此帳號有關聯資料，無法刪除
    } else if (error.response.status === 404) {
      console.error('帳號不存在');
    }
  }
}
```

---

### 8.2 測試範例

**單元測試（Service 層）：**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountService } from './user-account.service';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('UserAccountService', () => {
  let service: UserAccountService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccountService,
        {
          provide: PrismaService,
          useValue: {
            userAccount: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              pagination: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserAccountService>(UserAccountService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('應該成功註冊帳號並加密密碼', async () => {
      const dto = { account: 'user001', password: 'password123' };
      const mockResult = {
        id: 1,
        type: 'Local',
        account: 'user001',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      jest.spyOn(bcrypt, 'hash').mockImplementation(() =>
        Promise.resolve('hashedPassword')
      );
      jest.spyOn(prisma.userAccount, 'create')
        .mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        account: 'user001',
        type: 'Local',
      }));
      expect(result).not.toHaveProperty('password'); // 密碼不應出現
    });
  });

  describe('login', () => {
    it('應該成功登入並更新最後登入時間', async () => {
      const dto = { account: 'user001', password: 'password123' };
      const mockUser = {
        id: 1,
        type: 'Local',
        account: 'user001',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      jest.spyOn(prisma.userAccount, 'findFirst')
        .mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() =>
        Promise.resolve(true)
      );
      jest.spyOn(prisma.userAccount, 'update')
        .mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

      const result = await service.login(dto);

      expect(result.lastLoginAt).toBeDefined();
      expect(result.account).toBe('user001');
    });

    it('應該在帳號不存在時拋出 401 錯誤', async () => {
      const dto = { account: 'nonexistent', password: 'password123' };

      jest.spyOn(prisma.userAccount, 'findFirst')
        .mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow('帳號或密碼錯誤');
    });

    it('應該在密碼錯誤時拋出 401 錯誤', async () => {
      const dto = { account: 'user001', password: 'wrongpassword' };
      const mockUser = {
        id: 1,
        type: 'Local',
        account: 'user001',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      jest.spyOn(prisma.userAccount, 'findFirst')
        .mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() =>
        Promise.resolve(false)
      );

      await expect(service.login(dto)).rejects.toThrow('帳號或密碼錯誤');
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

describe('UserAccountController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/user-account/register', () => {
    it('應該成功註冊帳號', () => {
      return request(app.getHttpServer())
        .post('/api/user-account/register')
        .send({
          account: 'e2e-test-user',
          password: 'test123456'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.account).toBe('e2e-test-user');
          expect(res.body.type).toBe('Local');
          expect(res.body).not.toHaveProperty('password');
          userId = res.body.id;
        });
    });

    it('應該在密碼過短時返回 400', () => {
      return request(app.getHttpServer())
        .post('/api/user-account/register')
        .send({
          account: 'test-user-2',
          password: '123'
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('密碼長度需為5~20位');
        });
    });
  });

  describe('POST /api/user-account/login', () => {
    it('應該成功登入', () => {
      return request(app.getHttpServer())
        .post('/api/user-account/login')
        .send({
          account: 'e2e-test-user',
          password: 'test123456'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.lastLoginAt).toBeDefined();
          // 假設返回 JWT Token
          // authToken = res.body.token;
        });
    });

    it('應該在密碼錯誤時返回 401', () => {
      return request(app.getHttpServer())
        .post('/api/user-account/login')
        .send({
          account: 'e2e-test-user',
          password: 'wrongpassword'
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('帳號或密碼錯誤');
        });
    });
  });

  describe('GET /api/user-account', () => {
    it('應該返回帳號列表', () => {
      return request(app.getHttpServer())
        .get('/api/user-account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
```

---

## 版本歷史

| 版本 | 日期       | 說明                                             | 作者   |
| ---- | ---------- | ------------------------------------------------ | ------ |
| v1.0 | 2025-11-17 | 初版發布，基於現有程式碼分析撰寫系統設計文件     | Claude |

---

**© 2025 Sys Public Property API Documentation Team. All rights reserved.**
