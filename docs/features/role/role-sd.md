# 角色管理模組 - 系統設計文件（SD）

> **版本：** v1.0
> **更新日期：** 2025-01-17
> **文件類型：** 系統設計文件

---

## 📋 目錄

- [1. 概述](#1-概述)
- [2. 系統架構概述](#2-系統架構概述)
- [3. API 文件規範](#3-api-文件規範)
- [4. 資料結構定義](#4-資料結構定義)
- [5. 業務邏輯設計](#5-業務邏輯設計)
- [6. 錯誤處理機制](#6-錯誤處理機制)
- [7. 安全性設計](#7-安全性設計)
- [8. 效能考量](#8-效能考量)
- [9. 範例代碼](#9-範例代碼)
- [10. 版本歷史](#10-版本歷史)

---

## 1. 概述

本文件詳細說明角色管理模組（Role Module）的技術設計與實作細節，包括 API 規格、資料結構、業務邏輯、錯誤處理等面向。

### 1.1 技術棧

- **框架**：NestJS
- **ORM**：Prisma
- **資料庫**：PostgreSQL
- **驗證**：class-validator + class-transformer
- **API 文件**：Swagger/OpenAPI

### 1.2 模組依賴

```typescript
RoleModule
  ├─> UserAccountModule（使用者帳號服務）
  ├─> PermissionModule（權限服務）
  └─> PrismaModule（資料庫服務）
```

---

## 2. 系統架構概述

### 2.1 模組結構

```
src/role/
├── role.module.ts              # 模組定義
├── role.controller.ts          # HTTP 路由控制器
├── role.service.ts             # 角色業務邏輯服務
├── user-role.service.ts        # 使用者角色關聯服務
├── dto/
│   ├── create-role.dto.ts      # 建立角色 DTO
│   ├── update-role.dto.ts      # 更新角色 DTO
│   ├── update-user-role.dto.ts # 更新使用者角色 DTO
│   └── find-all-query.dto.ts   # 查詢參數 DTO
└── entities/
    ├── role.entity.ts          # 角色實體
    └── user-role.entity.ts     # 使用者角色實體（空檔案，保留）
```

### 2.2 分層架構

```
[Controller 層]
     │
     ├─> 處理 HTTP 請求/回應
     ├─> 路由定義
     ├─> 參數驗證（透過 DTO）
     └─> 呼叫 Service 層

[Service 層]
     │
     ├─> RoleService：角色 CRUD 邏輯
     ├─> UserRoleService：使用者角色關聯邏輯
     └─> PermissionService：權限查詢與驗證

[Data 層]
     │
     └─> PrismaService：資料庫操作
```

### 2.3 資料流向

```
HTTP Request
    ↓
Controller（接收請求、驗證 DTO）
    ↓
Service（執行業務邏輯）
    ↓
Prisma ORM（資料庫操作）
    ↓
PostgreSQL Database
    ↓
Prisma ORM（返回原始資料）
    ↓
Service（資料轉換）
    ↓
Controller（plainToInstance → Entity）
    ↓
HTTP Response（JSON）
```

---

## 3. API 文件規範

### 3.1 API 端點清單

| HTTP Method | 端點路徑                          | 功能說明               | 權限需求       |
| ----------- | --------------------------------- | ---------------------- | -------------- |
| POST        | `/role`                           | 建立角色資料           | ROLE__CREATE   |
| GET         | `/role`                           | 取得所有角色資料       | ROLE__VIEW     |
| GET         | `/role/:id`                       | 取得單一角色資料       | ROLE__VIEW     |
| PATCH       | `/role/:id`                       | 修改角色資料           | ROLE__UPDATE   |
| DELETE      | `/role/:id`                       | 刪除角色資料（軟刪除） | ROLE__DELETE   |
| GET         | `/role/action/get-role-permission` | 取得角色功能權限列表   | （無限制）     |

---

### 3.2 POST /role - 建立角色資料

#### 3.2.1 Request 格式

**HTTP Method:** POST
**Path:** `/role`
**Content-Type:** `application/json`

**Request Body:**

```typescript
interface CreateRoleDto {
  /** 角色名稱（必填） */
  name: string;
  /** 是否啟用（可選，預設為 true） */
  isEnabled?: boolean;
  /** 權限列表（必填，不可重複） */
  permission: PermissionDto[];
}

interface PermissionDto {
  /** 權限名稱（必填） */
  name: Permission;
}
```

#### 3.2.2 欄位說明

| 欄位路徑         | 類型            | 必填 | 說明                                   |
| ---------------- | --------------- | ---- | -------------------------------------- |
| `name`           | string          | ✅   | 角色名稱                               |
| `isEnabled`      | boolean         | ❌   | 是否啟用，預設為 `true`                |
| `permission`     | PermissionDto[] | ✅   | 權限列表，至少需要一個權限             |
| `permission[].name` | Permission   | ✅   | 權限名稱，必須為有效的 Permission enum |

#### 3.2.3 Request 範例

```json
{
  "name": "財務主管",
  "isEnabled": true,
  "permission": [
    { "name": "USER__VIEW" },
    { "name": "USER__UPDATE" },
    { "name": "ROLE__VIEW" }
  ]
}
```

#### 3.2.4 Response 回應

**成功回應 (200 OK):**

```json
{
  "id": 1,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z",
  "name": "財務主管",
  "isEnabled": true,
  "permission": [
    { "name": "USER__VIEW" },
    { "name": "USER__UPDATE" },
    { "name": "ROLE__VIEW" }
  ],
  "userCount": 0
}
```

**失敗回應：**

**1. 參數驗證錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "name should not be empty",
    "permission must be an array"
  ]
}
```

**2. 權限重複 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "permission must not contain duplicate values for key 'name'"
  ]
}
```

---

### 3.3 GET /role - 取得所有角色資料

#### 3.3.1 Request 格式

**HTTP Method:** GET
**Path:** `/role`
**Query Parameters:**

```typescript
interface FindAllQueryDto extends PaginationQueryDto {
  /** 頁碼（可選，預設為 1） */
  page?: number;
  /** 每頁筆數（可選，預設為 10） */
  limit?: number;
}
```

#### 3.3.2 Query 參數說明

| 參數名稱 | 類型   | 必填 | 預設值 | 說明     |
| -------- | ------ | ---- | ------ | -------- |
| `page`   | number | ❌   | 1      | 頁碼     |
| `limit`  | number | ❌   | 10     | 每頁筆數 |

#### 3.3.3 Request 範例

```
GET /role?page=1&limit=20
```

#### 3.3.4 Response 回應

**成功回應 (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "createdAt": "2025-01-17T10:00:00.000Z",
      "updatedAt": "2025-01-17T10:00:00.000Z",
      "name": "財務主管",
      "isEnabled": true,
      "permission": [
        { "name": "USER__VIEW" },
        { "name": "USER__UPDATE" }
      ],
      "userCount": 3
    },
    {
      "id": 2,
      "createdAt": "2025-01-17T11:00:00.000Z",
      "updatedAt": "2025-01-17T11:00:00.000Z",
      "name": "系統管理員",
      "isEnabled": true,
      "permission": [
        { "name": "USER__VIEW" },
        { "name": "USER__CREATE" },
        { "name": "USER__UPDATE" },
        { "name": "USER__DELETE" },
        { "name": "ROLE__VIEW" },
        { "name": "ROLE__CREATE" },
        { "name": "ROLE__UPDATE" },
        { "name": "ROLE__DELETE" }
      ],
      "userCount": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### 3.4 GET /role/:id - 取得單一角色資料

#### 3.4.1 Request 格式

**HTTP Method:** GET
**Path:** `/role/:id`
**Path Parameters:**

| 參數名稱 | 類型   | 必填 | 說明    |
| -------- | ------ | ---- | ------- |
| `id`     | number | ✅   | 角色 ID |

#### 3.4.2 Request 範例

```
GET /role/1
```

#### 3.4.3 Response 回應

**成功回應 (200 OK):**

```json
{
  "id": 1,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z",
  "name": "財務主管",
  "isEnabled": true,
  "permission": [
    { "name": "USER__VIEW" },
    { "name": "USER__UPDATE" },
    { "name": "ROLE__VIEW" }
  ],
  "userCount": 3
}
```

**失敗回應：**

**1. 角色不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "找無此角色"
}
```

---

### 3.5 PATCH /role/:id - 修改角色資料

#### 3.5.1 Request 格式

**HTTP Method:** PATCH
**Path:** `/role/:id`
**Path Parameters:**

| 參數名稱 | 類型   | 必填 | 說明    |
| -------- | ------ | ---- | ------- |
| `id`     | number | ✅   | 角色 ID |

**Request Body:**

```typescript
interface UpdateRoleDto {
  /** 角色名稱（可選） */
  name?: string;
  /** 是否啟用（可選） */
  isEnabled?: boolean;
  /** 權限列表（可選，若提供則會完全替換現有權限） */
  permission?: PermissionDto[];
}
```

#### 3.5.2 欄位說明

| 欄位路徑            | 類型            | 必填 | 說明                                       |
| ------------------- | --------------- | ---- | ------------------------------------------ |
| `name`              | string          | ❌   | 角色名稱                                   |
| `isEnabled`         | boolean         | ❌   | 是否啟用                                   |
| `permission`        | PermissionDto[] | ❌   | 權限列表（若提供，會刪除舊權限並建立新權限） |
| `permission[].name` | Permission      | ✅   | 權限名稱                                   |

#### 3.5.3 Request 範例

**範例 1：僅更新角色名稱**

```json
{
  "name": "財務部主管"
}
```

**範例 2：更新權限列表**

```json
{
  "permission": [
    { "name": "USER__VIEW" },
    { "name": "ROLE__VIEW" },
    { "name": "ROLE__UPDATE" }
  ]
}
```

**範例 3：同時更新多個欄位**

```json
{
  "name": "財務部主管",
  "isEnabled": false,
  "permission": [
    { "name": "USER__VIEW" }
  ]
}
```

#### 3.5.4 Response 回應

**成功回應 (200 OK):**

```json
{
  "id": 1,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T12:00:00.000Z",
  "name": "財務部主管",
  "isEnabled": true,
  "permission": [
    { "name": "USER__VIEW" },
    { "name": "ROLE__VIEW" },
    { "name": "ROLE__UPDATE" }
  ],
  "userCount": 3
}
```

**失敗回應：**

**1. 角色不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "找無此角色"
}
```

---

### 3.6 DELETE /role/:id - 刪除角色資料

#### 3.6.1 Request 格式

**HTTP Method:** DELETE
**Path:** `/role/:id`
**Path Parameters:**

| 參數名稱 | 類型   | 必填 | 說明    |
| -------- | ------ | ---- | ------- |
| `id`     | number | ✅   | 角色 ID |

#### 3.6.2 Request 範例

```
DELETE /role/1
```

#### 3.6.3 Response 回應

**成功回應 (204 No Content):**

```
（無回傳內容）
```

**失敗回應：**

**1. 角色不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "找無此角色"
}
```

**2. 角色仍被使用 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "此角色已被設定，無法刪除"
}
```

---

### 3.7 GET /role/action/get-role-permission - 取得角色功能權限列表

#### 3.7.1 Request 格式

**HTTP Method:** GET
**Path:** `/role/action/get-role-permission`
**Query Parameters:** 無

#### 3.7.2 Request 範例

```
GET /role/action/get-role-permission
```

#### 3.7.3 Response 回應

**成功回應 (200 OK):**

```json
{
  "action": [
    {
      "name": "VIEW",
      "displayName": "檢視"
    },
    {
      "name": "CREATE",
      "displayName": "建立"
    },
    {
      "name": "UPDATE",
      "displayName": "更新"
    },
    {
      "name": "DELETE",
      "displayName": "刪除"
    }
  ],
  "menu": [
    {
      "featureName": "USER",
      "displayName": "使用者管理",
      "permission": [
        {
          "action": "VIEW",
          "displayName": "檢視",
          "name": "USER__VIEW"
        },
        {
          "action": "CREATE",
          "displayName": "建立",
          "name": "USER__CREATE"
        },
        {
          "action": "UPDATE",
          "displayName": "更新",
          "name": "USER__UPDATE"
        },
        {
          "action": "DELETE",
          "displayName": "刪除",
          "name": "USER__DELETE"
        }
      ]
    },
    {
      "featureName": "ROLE",
      "displayName": "角色管理",
      "permission": [
        {
          "action": "VIEW",
          "displayName": "檢視",
          "name": "ROLE__VIEW"
        },
        {
          "action": "CREATE",
          "displayName": "建立",
          "name": "ROLE__CREATE"
        },
        {
          "action": "UPDATE",
          "displayName": "更新",
          "name": "ROLE__UPDATE"
        },
        {
          "action": "DELETE",
          "displayName": "刪除",
          "name": "ROLE__DELETE"
        }
      ]
    }
  ]
}
```

---

## 4. 資料結構定義

### 4.1 Entity 定義

#### 4.1.1 RoleEntity

```typescript
/**
 * 角色實體
 * 對應資料庫 role 表
 */
@Exclude()
export class RoleEntity implements Role {
  /** 主鍵 ID */
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  /** 建立時間 */
  @ApiProperty()
  @Expose()
  createdAt!: Date;

  /** 更新時間 */
  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  /** 刪除時間（軟刪除） */
  deletedAt!: Date | null;

  /** 角色名稱 */
  @ApiProperty({ example: '角色名稱' })
  @Expose()
  name!: string;

  /** 是否啟用 */
  @ApiProperty()
  @Expose()
  isEnabled!: boolean;

  /** 角色權限關聯（內部使用，不對外暴露） */
  @Expose({ toClassOnly: true })
  @Type(() => PermissionEntity)
  roleHasPermission!: PermissionEntity[];

  /** 權限列表（對外 API 欄位） */
  @ApiProperty({ type: PermissionEntity, isArray: true })
  @Expose()
  permission() {
    return this.roleHasPermission;
  }

  /** 使用者角色關聯（內部使用，不對外暴露） */
  @Expose({ toClassOnly: true })
  @Type(() => UserAccountHasRoleEntity)
  userAccountHasRole!: UserAccountHasRoleEntity[];

  /** 使用者數量（計算屬性） */
  @ApiProperty({ type: 'number', example: 1 })
  @Expose()
  userCount() {
    return this.userAccountHasRole.length;
  }
}
```

#### 4.1.2 PermissionEntity

```typescript
/**
 * 權限實體（嵌套在 RoleEntity 中）
 */
@ApiSchema({ prefix: 'RoleEntity' })
@Exclude()
export class PermissionEntity {
  /** 權限名稱（內部欄位） */
  @Expose({ toClassOnly: true })
  permission!: Permission;

  /** 權限名稱（對外 API 欄位） */
  @ApiProperty({ enum: Permission })
  @Expose()
  name() {
    return this.permission;
  }
}
```

#### 4.1.3 UserAccountHasRoleEntity

```typescript
/**
 * 使用者角色關聯實體（內部使用）
 */
@Exclude()
export class UserAccountHasRoleEntity {
  userAccountId!: number;
}
```

---

### 4.2 DTO 定義

#### 4.2.1 CreateRoleDto

```typescript
/**
 * 建立角色 DTO
 */
export class CreateRoleDto {
  /** 角色名稱（必填） */
  @ApiProperty({ example: '角色名稱' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  /** 是否啟用（可選） */
  @ApiPropertyOptional()
  @Sometimes()
  @IsBoolean()
  isEnabled?: boolean;

  /** 權限列表（必填，不可重複） */
  @ApiProperty({ type: PermissionDto, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ArrayObjDistinct('name')
  @ValidateNested()
  @Type(() => PermissionDto)
  permission!: PermissionDto[];
}

/**
 * 權限 DTO（嵌套在 CreateRoleDto 中）
 */
@ApiSchema({ prefix: 'CreateRoleDto' })
export class PermissionDto {
  /** 權限名稱（必填） */
  @ApiProperty({ enum: Permission })
  @IsNotEmpty()
  @IsEnum(Permission)
  name!: Permission;
}
```

#### 4.2.2 UpdateRoleDto

```typescript
/**
 * 更新角色 DTO
 * 繼承 CreateRoleDto 並將所有欄位設為可選
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto, {
  skipNullProperties: true,
}) {}
```

#### 4.2.3 UpdateUserRoleDto

```typescript
/**
 * 更新使用者角色 DTO
 */
export class UpdateUserRoleDto {
  /** 使用者帳號 ID（必填） */
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  userAccountId!: number;

  /** 角色列表（必填） */
  @ApiProperty({ type: RoleDto, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  role!: RoleDto[];
}

/**
 * 角色 DTO（嵌套在 UpdateUserRoleDto 中）
 */
@ApiSchema({ prefix: 'UpdateUserRoleDto' })
export class RoleDto {
  /** 角色 ID（必填） */
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  id!: number;
}
```

#### 4.2.4 FindAllQueryDto

```typescript
/**
 * 查詢角色列表 DTO
 * 繼承 PaginationQueryDto 提供分頁功能
 */
export class FindAllQueryDto extends PaginationQueryDto {}
```

---

### 4.3 資料庫 Schema

#### 4.3.1 Role 表

```prisma
model Role {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)
  name      String
  isEnabled Boolean   @default(true) @map("is_enabled")

  userAccountHasRole UserAccountHasRole[]
  roleHasPermission  RoleHasPermission[]

  @@map("role")
}
```

**欄位說明：**

| 欄位名稱   | 資料型別  | 說明                         |
| ---------- | --------- | ---------------------------- |
| id         | Int       | 主鍵，自動遞增               |
| createdAt  | DateTime  | 建立時間，預設為當前時間     |
| updatedAt  | DateTime  | 更新時間，自動更新           |
| deletedAt  | DateTime? | 刪除時間（軟刪除），可為 null |
| name       | String    | 角色名稱                     |
| isEnabled  | Boolean   | 是否啟用，預設為 true        |

**關聯：**
- `userAccountHasRole`：一對多，角色與使用者帳號的關聯
- `roleHasPermission`：一對多，角色與權限的關聯

---

#### 4.3.2 RoleHasPermission 表

```prisma
model RoleHasPermission {
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  permission String

  role   Role @relation(fields: [roleId], references: [id])
  roleId Int  @map("role_id")

  @@id([roleId, permission])
  @@map("role_has_permission")
}
```

**欄位說明：**

| 欄位名稱   | 資料型別 | 說明                     |
| ---------- | -------- | ------------------------ |
| roleId     | Int      | 角色 ID（外鍵）          |
| permission | String   | 權限名稱                 |
| createdAt  | DateTime | 建立時間                 |
| updatedAt  | DateTime | 更新時間                 |

**主鍵：**
- 複合主鍵：`(roleId, permission)`
- 確保同一角色不會有重複的權限

**外鍵：**
- `roleId` → `Role.id`

---

#### 4.3.3 UserAccountHasRole 表

```prisma
model UserAccountHasRole {
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  userAccountId Int @map("user_account_id")
  roleId        Int @map("role_id")

  userAccount UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  role        Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userAccountId, roleId])
  @@map("user_account_has_role")
}
```

**欄位說明：**

| 欄位名稱      | 資料型別 | 說明                     |
| ------------- | -------- | ------------------------ |
| userAccountId | Int      | 使用者帳號 ID（外鍵）    |
| roleId        | Int      | 角色 ID（外鍵）          |
| createdAt     | DateTime | 建立時間                 |
| updatedAt     | DateTime | 更新時間                 |

**主鍵：**
- 複合主鍵：`(userAccountId, roleId)`
- 確保同一使用者不會重複擁有相同角色

**外鍵：**
- `userAccountId` → `UserAccount.id`（Cascade Delete）
- `roleId` → `Role.id`（Cascade Delete）

---

### 4.4 資料關聯圖

```
┌─────────────────┐
│  UserAccount    │
│                 │
│  - id           │
│  - email        │
│  - ...          │
└────────┬────────┘
         │
         │ 1:N
         │
         ↓
┌──────────────────────┐
│ UserAccountHasRole   │
│                      │
│  - userAccountId (FK)│
│  - roleId (FK)       │
│  - createdAt         │
│  - updatedAt         │
└──────────┬───────────┘
           │
           │ N:1
           │
           ↓
    ┌──────────────┐
    │    Role      │
    │              │
    │  - id        │
    │  - name      │
    │  - isEnabled │
    │  - createdAt │
    │  - updatedAt │
    │  - deletedAt │
    └──────┬───────┘
           │
           │ 1:N
           │
           ↓
┌──────────────────────┐
│ RoleHasPermission    │
│                      │
│  - roleId (FK)       │
│  - permission        │
│  - createdAt         │
│  - updatedAt         │
└──────────────────────┘
```

**關聯說明：**

1. **UserAccount ↔ Role（多對多）**
   - 透過 `UserAccountHasRole` 關聯表
   - 一個使用者可以擁有多個角色
   - 一個角色可以被多個使用者使用

2. **Role ↔ Permission（一對多）**
   - 透過 `RoleHasPermission` 關聯表
   - 一個角色可以擁有多個權限
   - 使用複合主鍵確保權限不重複

---

## 5. 業務邏輯設計

### 5.1 RoleService 設計

#### 5.1.1 服務職責

- 角色的 CRUD 操作
- 角色存在性驗證
- 角色使用狀態檢查
- 資料查詢與分頁

#### 5.1.2 核心方法

**create() - 建立角色**

```typescript
/**
 * 建立角色
 * @param createRoleDto - 建立角色 DTO
 * @param include - 需要載入的關聯資料
 * @returns 建立的角色資料
 */
create(createRoleDto: CreateRoleDto, include?: Prisma.RoleInclude) {
  const { name, isEnabled, permission } = createRoleDto;

  const data: Prisma.RoleCreateInput = {
    name,
    isEnabled,
    roleHasPermission: {
      create: permission.map(({ name }) => ({
        permission: name,
      })),
    },
  };

  return this.prisma.role.create({ data, include });
}
```

**設計重點：**
- 使用 Prisma 的巢狀建立（nested create）同時建立角色和權限關聯
- 透過 `include` 參數控制需要載入的關聯資料
- `permission.map()` 將 DTO 陣列轉換為 Prisma 建立格式

---

**update() - 更新角色**

```typescript
/**
 * 更新角色
 * @param where - 查詢條件
 * @param updateRoleDto - 更新角色 DTO
 * @param include - 需要載入的關聯資料
 * @returns 更新後的角色資料
 */
update(
  where: Prisma.RoleWhereUniqueInput,
  updateRoleDto: UpdateRoleDto,
  include?: Prisma.RoleInclude,
) {
  const { name, isEnabled, permission } = updateRoleDto;

  const data: Prisma.RoleUpdateInput = {
    name,
    isEnabled,
  };

  if (permission !== undefined) {
    data.roleHasPermission = {
      deleteMany: {},
      create: permission.map(({ name }) => ({
        permission: name,
      })),
    };
  }

  return this.prisma.role.update({ where, data, include });
}
```

**設計重點：**
- 只有當 `permission` 欄位被提供時，才會更新權限
- 使用「先刪除後建立」策略：
  - `deleteMany: {}` - 刪除該角色的所有權限
  - `create: [...]` - 建立新的權限關聯
- 確保權限資料完全同步

---

**softDelete() - 軟刪除角色**

```typescript
/**
 * 軟刪除角色
 * @param where - 查詢條件
 * @throws 若角色仍被使用者使用，拋出錯誤
 */
async softDelete(where: Prisma.RoleWhereUniqueInput) {
  if (await this.hasUser(where.id!)) {
    abort('此角色已被設定，無法刪除');
  }

  return this.prisma.role.softDelete({ where });
}
```

**設計重點：**
- 在刪除前使用 `hasUser()` 檢查角色是否仍被使用
- 若有使用者使用，使用 `abort()` 拋出 400 錯誤
- 使用 Prisma 的 `softDelete()` 方法（需要自訂擴展）

---

**hasUser() - 檢查角色是否被使用**

```typescript
/**
 * 檢查角色是否被使用者使用
 * @param roleId - 角色 ID
 * @returns 是否有使用者使用此角色
 */
async hasUser(roleId: number) {
  const role = await this.prisma.role.findFirst({
    where: { id: roleId, userAccountHasRole: { some: {} } },
  });

  return role !== null;
}
```

**設計重點：**
- 使用 `userAccountHasRole: { some: {} }` 檢查是否存在關聯記錄
- 返回布林值，方便在其他方法中使用

---

**existsOrThrow() - 驗證角色存在性**

```typescript
/**
 * 驗證角色是否存在，不存在則拋出錯誤
 * @param where - 查詢條件
 * @throws 若角色不存在，拋出 404 錯誤
 */
async existsOrThrow(where: Prisma.RoleWhereUniqueInput) {
  const isExists = await this.prisma.role.exists({ where });

  if (!isExists) {
    abort('找無此角色', HttpStatus.NOT_FOUND);
  }

  return isExists;
}
```

**設計重點：**
- 統一的存在性檢查方法
- 拋出 404 錯誤，符合 RESTful 規範
- 在 Controller 層的更新、刪除操作中使用

---

### 5.2 UserRoleService 設計

#### 5.2.1 服務職責

- 查詢使用者擁有的角色
- 更新使用者的角色配置

#### 5.2.2 核心方法

**getRole() - 取得使用者角色**

```typescript
/**
 * 取得使用者擁有的角色列表
 * @param userAccountId - 使用者帳號 ID
 * @returns 角色列表
 */
async getRole(userAccountId: number) {
  return this.prisma.role.findMany({
    where: { userAccountHasRole: { some: { userAccountId } } },
  });
}
```

---

**updateRole() - 更新使用者角色**

```typescript
/**
 * 更新使用者的角色配置
 * @param updateUserRoleDto - 更新使用者角色 DTO
 * @returns 更新後的使用者帳號資料
 */
async updateRole(updateUserRoleDto: UpdateUserRoleDto) {
  const { userAccountId, role } = updateUserRoleDto;

  await this.userAccountService.findOne(userAccountId);

  const getCreateRoleData =
    (): Prisma.UserAccountHasRoleCreateWithoutUserAccountInput[] => {
      return role.map(({ id }) => ({
        role: { connect: { id } },
      }));
    };

  return await this.prisma.userAccount.update({
    where: { id: userAccountId },
    data: {
      userAccountHasRole: {
        deleteMany: {},
        create: getCreateRoleData(),
      },
    },
  });
}
```

**設計重點：**
- 先驗證使用者帳號存在（透過 `userAccountService.findOne()`）
- 使用「先刪除後建立」策略更新角色關聯
- `getCreateRoleData()` 函數將 DTO 轉換為 Prisma 建立格式
- 使用 `connect` 關聯現有的角色資料

---

### 5.3 PermissionService 設計

#### 5.3.1 服務職責

- 查詢角色或使用者的權限
- 驗證權限是否足夠
- 提供權限清單供前端使用

#### 5.3.2 核心方法

**getByUser() - 取得使用者權限**

```typescript
/**
 * 取得使用者的所有權限（包含直接權限和角色權限）
 * @param userAccountId - 使用者帳號 ID 或 ID 陣列
 * @returns 權限列表（已去重）
 */
async getByUser(userAccountId: number | number[]): Promise<Permission[]> {
  userAccountId = Array.isArray(userAccountId)
    ? userAccountId
    : [userAccountId];

  const userAccount = await this.prisma.userAccount.findMany({
    where: { id: { in: userAccountId } },
    include: {
      userAccountHasPermission: true,
      userAccountHasRole: {
        include: {
          role: {
            include: { roleHasPermission: true },
          },
        },
      },
    },
  });

  return uniq([
    ...userAccount
      .flatMap(({ userAccountHasPermission }) => userAccountHasPermission)
      .map(({ permission }) => <Permission>permission),
    ...(await this._getRolesPermission(
      userAccount.flatMap(({ userAccountHasRole }) =>
        userAccountHasRole.flatMap(({ role }) => role),
      ),
    )),
  ]);
}
```

**設計重點：**
- 支援單一或多個使用者 ID 查詢
- 同時查詢直接權限（`userAccountHasPermission`）和角色權限（`userAccountHasRole.role.roleHasPermission`）
- 使用 `uniq()` 去除重複的權限
- 使用 `flatMap()` 扁平化巢狀陣列

---

**checkPermission() - 驗證權限**

```typescript
/**
 * 檢查使用者是否擁有所需權限
 * @param hasPermission - 使用者擁有的權限列表
 * @param needPermission - 所需的權限列表
 * @throws 若權限不足，拋出錯誤
 */
async checkPermission(
  hasPermission: Permission[],
  needPermission: Permission[],
) {
  const lackPermission: Permission[] = [];

  for (const permission of needPermission) {
    if (!hasPermission.includes(permission)) {
      lackPermission.push(permission);
    }
  }

  if (lackPermission.length > 0) {
    abort(`權限不足，缺少${lackPermission.join(',')}權限`);
  }
}
```

**設計重點：**
- 逐一檢查所需權限是否在擁有權限中
- 收集所有缺少的權限
- 若有缺少的權限，拋出 400 錯誤並列出缺少的權限

---

## 6. 錯誤處理機制

### 6.1 錯誤類型與處理

#### 6.1.1 參數驗證錯誤（400 Bad Request）

**觸發條件：**
- 必填欄位為空
- 資料型別不正確
- 權限陣列包含重複項目
- 權限名稱不在 Permission enum 中

**處理方式：**
- 使用 class-validator 自動驗證 DTO
- NestJS 自動捕獲驗證錯誤並返回 400 錯誤
- 錯誤訊息陣列包含所有驗證失敗的欄位

**範例：**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "name should not be empty",
    "permission must be an array",
    "permission must not contain duplicate values for key 'name'"
  ]
}
```

---

#### 6.1.2 資源不存在（404 Not Found）

**觸發條件：**
- 查詢、更新或刪除不存在的角色

**處理方式：**
- 使用 `existsOrThrow()` 方法檢查
- 拋出 `abort('找無此角色', HttpStatus.NOT_FOUND)`

**範例：**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "找無此角色"
}
```

---

#### 6.1.3 業務規則錯誤（400 Bad Request）

**觸發條件：**
- 嘗試刪除仍被使用者使用的角色

**處理方式：**
- 使用 `hasUser()` 方法檢查
- 拋出 `abort('此角色已被設定，無法刪除')`

**範例：**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "此角色已被設定，無法刪除"
}
```

---

#### 6.1.4 權限不足（400 Bad Request）

**觸發條件：**
- 使用者嘗試執行沒有權限的操作

**處理方式：**
- 使用 `PermissionService.checkPermission()` 驗證
- 拋出 `abort('權限不足，缺少XXX權限')`

**範例：**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "權限不足，缺少ROLE__CREATE,ROLE__UPDATE權限"
}
```

---

### 6.2 錯誤處理最佳實踐

#### 6.2.1 統一的錯誤拋出

使用 `abort()` 工具函數統一拋出錯誤：

```typescript
import { abort } from 'src/_libs/api-response/abort.util';

// 預設 400 錯誤
abort('錯誤訊息');

// 指定 HTTP 狀態碼
abort('找無此角色', HttpStatus.NOT_FOUND);
```

#### 6.2.2 Controller 層錯誤處理

Controller 層不需要 try-catch，NestJS 會自動捕獲並處理錯誤：

```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  const where: Prisma.RoleWhereUniqueInput = {
    id,
    deletedAt: null,
  };

  // 若角色不存在，existsOrThrow 會自動拋出 404 錯誤
  await this.roleService.existsOrThrow(where);

  return plainToInstance(
    RoleEntity,
    await this.roleService.findOne(where, this.defaultInclude),
  );
}
```

---

## 7. 安全性設計

### 7.1 驗證與授權

#### 7.1.1 JWT 認證

所有 API 端點都需要 JWT Token 認證：

```typescript
// 在 main.ts 或 AppModule 中設定全域 JWT Guard
app.useGlobalGuards(new JwtAuthGuard());
```

#### 7.1.2 權限檢查

使用權限守衛（Permission Guard）檢查使用者權限：

```typescript
@ApiOperation({ summary: '建立角色資料' })
@RequirePermissions(Permission.ROLE__CREATE)  // 權限裝飾器
@Post()
async create(@Body() createRoleDto: CreateRoleDto) {
  // ...
}
```

#### 7.1.3 軟刪除過濾

所有查詢都必須過濾已軟刪除的資料：

```typescript
const where: Prisma.RoleWhereInput = {
  deletedAt: null,  // 重要：過濾已刪除的資料
};
```

---

### 7.2 資料驗證

#### 7.2.1 DTO 驗證

使用 class-validator 裝飾器進行嚴格驗證：

```typescript
export class CreateRoleDto {
  @IsNotEmpty()        // 不可為空
  @IsString()          // 必須為字串
  name!: string;

  @Sometimes()         // 可選但若提供必須符合類型
  @IsBoolean()
  isEnabled?: boolean;

  @IsNotEmpty()
  @IsArray()           // 必須為陣列
  @ArrayObjDistinct('name')  // 陣列中 name 欄位不可重複
  @ValidateNested()    // 驗證巢狀物件
  @Type(() => PermissionDto)
  permission!: PermissionDto[];
}
```

#### 7.2.2 型別安全

使用 TypeScript 確保型別安全：

```typescript
// 使用 Prisma 生成的型別
const data: Prisma.RoleCreateInput = {
  name,
  isEnabled,
  roleHasPermission: {
    create: permission.map(({ name }) => ({
      permission: name,
    })),
  },
};
```

---

### 7.3 SQL Injection 防護

使用 Prisma ORM 自動防止 SQL Injection：

```typescript
// ✅ 安全：Prisma 會自動處理參數化查詢
await this.prisma.role.findUnique({
  where: { id },
});

// ❌ 危險：不要使用原始 SQL（除非必要且已消毒）
await this.prisma.$queryRaw`SELECT * FROM role WHERE id = ${id}`;
```

---

## 8. 效能考量

### 8.1 資料庫查詢優化

#### 8.1.1 使用 Include 載入關聯資料

一次查詢載入所需的關聯資料，避免 N+1 問題：

```typescript
const defaultInclude: Prisma.RoleInclude = {
  roleHasPermission: true,      // 載入權限關聯
  userAccountHasRole: true,     // 載入使用者關聯
};

await this.roleService.findOne(where, defaultInclude);
```

#### 8.1.2 分頁查詢

使用 Prisma 的分頁擴展方法：

```typescript
const { result, ...meta } = await this.roleService.pagination({
  page,
  limit,
  where,
  orderBy: { id: 'desc' },
  include: this.defaultInclude,
});
```

#### 8.1.3 索引建議

建議在以下欄位建立索引：

```sql
-- role 表
CREATE INDEX idx_role_deleted_at ON role(deleted_at);
CREATE INDEX idx_role_is_enabled ON role(is_enabled);

-- role_has_permission 表
CREATE INDEX idx_role_has_permission_role_id ON role_has_permission(role_id);

-- user_account_has_role 表
CREATE INDEX idx_user_account_has_role_user_account_id ON user_account_has_role(user_account_id);
CREATE INDEX idx_user_account_has_role_role_id ON user_account_has_role(role_id);
```

---

### 8.2 快取策略（建議）

#### 8.2.1 使用者權限快取

```typescript
// 使用 Redis 快取使用者權限
const cacheKey = `user:${userId}:permissions`;
const cachedPermissions = await redis.get(cacheKey);

if (cachedPermissions) {
  return JSON.parse(cachedPermissions);
}

const permissions = await this.permissionService.getByUser(userId);
await redis.set(cacheKey, JSON.stringify(permissions), 'EX', 3600);  // 1小時

return permissions;
```

#### 8.2.2 快取失效策略

當角色權限變更時，清除相關快取：

```typescript
async update(where, updateRoleDto, include) {
  const updatedRole = await this.prisma.role.update({ where, data, include });

  // 清除所有擁有此角色的使用者的權限快取
  await this.clearUserPermissionCache(where.id);

  return updatedRole;
}
```

---

## 9. 範例代碼

### 9.1 前端整合範例

#### 9.1.1 建立角色

```typescript
// TypeScript + Axios
import axios from 'axios';

interface CreateRoleDto {
  name: string;
  isEnabled?: boolean;
  permission: { name: string }[];
}

async function createRole(data: CreateRoleDto) {
  try {
    const response = await axios.post('/role', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('角色建立成功:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('錯誤:', error.response.data.message);
    }
    throw error;
  }
}

// 使用範例
await createRole({
  name: '財務主管',
  isEnabled: true,
  permission: [
    { name: 'USER__VIEW' },
    { name: 'USER__UPDATE' },
    { name: 'ROLE__VIEW' },
  ],
});
```

---

#### 9.1.2 查詢角色列表

```typescript
async function getRoles(page: number = 1, limit: number = 20) {
  try {
    const response = await axios.get('/role', {
      params: { page, limit },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const { data, meta } = response.data;

    console.log(`共 ${meta.total} 筆角色，目前第 ${meta.page} 頁`);
    return { data, meta };
  } catch (error) {
    console.error('查詢失敗:', error);
    throw error;
  }
}
```

---

#### 9.1.3 更新角色權限

```typescript
async function updateRolePermissions(
  roleId: number,
  permissions: { name: string }[]
) {
  try {
    const response = await axios.patch(`/role/${roleId}`, {
      permission: permissions,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('權限更新成功:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('角色不存在');
    } else {
      console.error('更新失敗:', error.response?.data.message);
    }
    throw error;
  }
}
```

---

#### 9.1.4 刪除角色（含錯誤處理）

```typescript
async function deleteRole(roleId: number) {
  try {
    await axios.delete(`/role/${roleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('角色刪除成功');
    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      // 角色仍被使用，無法刪除
      alert(error.response.data.message);  // "此角色已被設定，無法刪除"
    } else if (error.response?.status === 404) {
      console.error('角色不存在');
    }
    throw error;
  }
}
```

---

### 9.2 後端測試範例

#### 9.2.1 RoleService 單元測試

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { PrismaService } from 'src/_libs/prisma/prisma.service';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: {
            role: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              softDelete: jest.fn(),
              exists: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('應該成功建立角色', async () => {
      const dto = {
        name: '測試角色',
        isEnabled: true,
        permission: [{ name: 'USER__VIEW' }],
      };

      const mockResult = {
        id: 1,
        name: '測試角色',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prisma.role, 'create').mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(result).toEqual(mockResult);
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: '測試角色',
          isEnabled: true,
          roleHasPermission: {
            create: [{ permission: 'USER__VIEW' }],
          },
        },
        include: undefined,
      });
    });
  });

  describe('hasUser', () => {
    it('應該返回 true 當角色被使用者使用時', async () => {
      jest.spyOn(prisma.role, 'findFirst').mockResolvedValue({} as any);

      const result = await service.hasUser(1);

      expect(result).toBe(true);
    });

    it('應該返回 false 當角色未被使用者使用時', async () => {
      jest.spyOn(prisma.role, 'findFirst').mockResolvedValue(null);

      const result = await service.hasUser(1);

      expect(result).toBe(false);
    });
  });
});
```

---

#### 9.2.2 RoleController E2E 測試

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

describe('RoleController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 取得認證 Token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /role', () => {
    it('應該成功建立角色', () => {
      return request(app.getHttpServer())
        .post('/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E 測試角色',
          isEnabled: true,
          permission: [{ name: 'USER__VIEW' }],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('E2E 測試角色');
          expect(res.body.permission).toHaveLength(1);
        });
    });

    it('應該拒絕無效的權限名稱', () => {
      return request(app.getHttpServer())
        .post('/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '無效角色',
          permission: [{ name: 'INVALID_PERMISSION' }],
        })
        .expect(400);
    });
  });

  describe('DELETE /role/:id', () => {
    it('應該拒絕刪除仍被使用的角色', async () => {
      // 假設角色 ID 1 仍被使用者使用
      return request(app.getHttpServer())
        .delete('/role/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('此角色已被設定，無法刪除');
        });
    });
  });
});
```

---

## 10. 版本歷史

| 版本 | 日期       | 說明             | 作者        |
| ---- | ---------- | ---------------- | ----------- |
| v1.0 | 2025-01-17 | 初版發布         | Claude Code |

---

**© 2025 Sys Public Property API Documentation Team. All rights reserved.**
