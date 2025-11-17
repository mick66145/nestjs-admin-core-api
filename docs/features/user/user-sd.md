# 後台使用者管理系統設計文件 (SD)

> **版本：** v1.0
> **更新日期：** 2025-01-17
> **文件類型：** 系統設計與技術規格文件

---

## 📋 目錄

- [1. 系統架構概述](#1-系統架構概述)
- [2. API 文件規範](#2-api-文件規範)
- [3. 資料結構定義](#3-資料結構定義)
- [4. 業務邏輯設計](#4-業務邏輯設計)
- [5. 錯誤處理機制](#5-錯誤處理機制)
- [6. 安全性設計](#6-安全性設計)
- [7. 第三方服務整合](#7-第三方服務整合)
- [8. 效能考量](#8-效能考量)
- [9. 範例代碼](#9-範例代碼)
- [10. 版本歷史](#10-版本歷史)

---

## 1. 系統架構概述

### 1.1 技術棧

| 層級           | 技術                    | 版本   | 說明                    |
| -------------- | ----------------------- | ------ | ----------------------- |
| 框架           | NestJS                  | 10.x   | Node.js 後端框架        |
| 語言           | TypeScript              | 5.x    | 靜態類型語言            |
| ORM            | Prisma                  | 5.x    | 資料庫 ORM              |
| 資料庫         | PostgreSQL              | 14.x   | 關聯式資料庫            |
| 認證           | JWT (jsonwebtoken)      | 9.x    | Token 認證              |
| 加密           | bcrypt                  | 5.x    | 密碼加密                |
| 驗證           | class-validator         | 0.14.x | DTO 資料驗證            |
| 轉換           | class-transformer       | 0.5.x  | 物件轉換                |
| API 文件       | Swagger (@nestjs/swagger) | 7.x    | API 文件自動生成        |

### 1.2 模組架構

```
user.module.ts (主模組)
│
├─ Controllers (控制器層)
│  ├─ user.controller.ts          (使用者管理)
│  └─ user-auth.controller.ts     (認證相關)
│
├─ Services (服務層)
│  ├─ user.service.ts              (使用者業務邏輯)
│  ├─ user-auth.service.ts         (認證業務邏輯)
│  └─ verify-token.service.ts      (驗證 Token 管理)
│
├─ Guards (守衛層)
│  └─ user-auth.guard.ts           (JWT 認證守衛)
│
├─ Decorators (裝飾器)
│  ├─ use-auth.decorator.ts        (認證裝飾器)
│  ├─ auth-data.decorator.ts       (取得認證資料)
│  └─ user-auth-public.decorator.ts (公開 API 標記)
│
├─ DTOs (資料傳輸物件)
│  ├─ create-user.dto.ts           (建立使用者)
│  ├─ update-user.dto.ts           (更新使用者)
│  ├─ find-all-query.dto.ts        (查詢參數)
│  ├─ login.dto.ts                 (登入)
│  ├─ register.dto.ts              (註冊)
│  ├─ verify.dto.ts                (驗證)
│  ├─ refresh-token.dto.ts         (刷新 Token)
│  ├─ forget-password.dto.ts       (忘記密碼)
│  └─ third-party-login.dto.ts     (第三方登入)
│
├─ Entities (實體)
│  ├─ user.entity.ts               (使用者實體)
│  ├─ token.entity.ts              (Token 實體)
│  ├─ profile.entity.ts            (個人資料實體)
│  ├─ register.entity.ts           (註冊回應實體)
│  └─ forget-password.entity.ts    (忘記密碼回應實體)
│
├─ Enums (列舉)
│  ├─ verify-type.enum.ts          (驗證類型)
│  ├─ message-send-method.enum.ts  (訊息發送方式)
│  ├─ third-party-login-type.enum.ts (第三方登入類型)
│  └─ forget-password-send-method.enum.ts (忘記密碼發送方式)
│
└─ Interfaces (介面)
   └─ user-auth.interface.ts       (認證介面定義)
```

### 1.3 依賴關係

```
UserModule
  ├─> UserAccountModule        (使用者帳號管理)
  ├─> VerificationModule        (驗證碼管理)
  ├─> RoleModule                (角色管理)
  ├─> E8dSmsModule              (簡訊服務)
  ├─> GoogleMailModule          (郵件服務)
  ├─> GoogleLoginModule         (Google 登入)
  └─> LineLoginModule           (Line 登入)
```

---

## 2. API 文件規範

### 2.1 基本資訊

| 項目         | 說明                                      |
| ------------ | ----------------------------------------- |
| **協定**     | HTTP/HTTPS                                |
| **資料格式** | JSON                                      |
| **字元編碼** | UTF-8                                     |
| **認證方式** | JWT Bearer Token                          |
| **API 前綴** | `/user` (使用者管理), `/user-auth` (認證) |

### 2.2 使用者管理 API (/user)

#### 2.2.1 建立後台使用者

**端點:** `POST /user`

**說明:** 管理員建立新的後台使用者並指派角色

**Request 格式:**

```typescript
interface CreateUserDto {
  /** 帳號 (必填) */
  account: string;
  /** 密碼 (必填) */
  password: string;
  /** 後台使用者名稱 (必填) */
  name: string;
  /** 手機 (選填) */
  phone?: string;
  /** Email (選填) */
  email?: string;
  /** 是否已啟用 (預設: true) */
  isEnabled: boolean;
  /** 角色 (必填) */
  role: {
    /** 角色 ID */
    id: number;
  };
}
```

**Request 範例:**

```json
{
  "account": "admin001",
  "password": "password123",
  "name": "管理員",
  "phone": "0912345678",
  "email": "admin@example.com",
  "isEnabled": true,
  "role": {
    "id": 1
  }
}
```

**Response 格式:**

```typescript
interface UserEntity {
  /** 使用者 ID */
  id: number;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
  /** 後台使用者名稱 */
  name: string;
  /** 手機 */
  phone: string | null;
  /** Email */
  email: string | null;
  /** 是否已驗證 */
  isValid: boolean;
  /** 是否已啟用 */
  isEnabled: boolean;
  /** 帳號資訊 */
  userAccount: {
    /** 帳號 ID */
    id: number;
    /** 帳號 */
    account: string;
    /** 帳號類型 */
    type: string;
    /** 最後登入時間 */
    lastLoginAt: Date | null;
  };
  /** 角色 */
  role: {
    /** 角色 ID */
    id: number;
    /** 角色名稱 */
    name: string;
  } | null;
}
```

**Response 範例 (200 OK):**

```json
{
  "id": 1,
  "createdAt": "2025-01-17T10:00:00.000Z",
  "updatedAt": "2025-01-17T10:00:00.000Z",
  "name": "管理員",
  "phone": "0912345678",
  "email": "admin@example.com",
  "isValid": true,
  "isEnabled": true,
  "userAccount": {
    "id": 1,
    "account": "admin001",
    "type": "NORMAL",
    "lastLoginAt": null
  },
  "role": {
    "id": 1,
    "name": "系統管理員"
  }
}
```

**錯誤回應:**

- **400 Bad Request** - 參數驗證失敗
- **409 Conflict** - 帳號已存在
- **404 Not Found** - 角色不存在

---

#### 2.2.2 建立超級管理員

**端點:** `POST /user/root`

**說明:** 建立擁有所有權限的超級管理員帳號

**Request 格式:**

```typescript
interface CreateRootUserDto {
  /** 帳號 (必填) */
  account: string;
  /** 密碼 (必填) */
  password: string;
  /** 後台使用者名稱 (必填) */
  name: string;
  /** 手機 (選填) */
  phone?: string;
  /** Email (選填) */
  email?: string;
  /** 是否已啟用 (預設: true) */
  isEnabled: boolean;
}
```

**Response:** 同 UserEntity

---

#### 2.2.3 取得所有後台使用者資料

**端點:** `GET /user`

**說明:** 查詢所有使用者,支援關鍵字搜尋、角色篩選、分頁

**Query 參數:**

| 參數名稱 | 類型     | 必填 | 說明                                         |
| -------- | -------- | ---- | -------------------------------------------- |
| `page`   | number   | ❌   | 頁碼 (預設: 1)                               |
| `limit`  | number   | ❌   | 每頁筆數 (預設: 10)                          |
| `ids`    | number[] | ❌   | 後台使用者 IDs (多個用逗號分隔)              |
| `roleIds`| number[] | ❌   | 角色 IDs (多個用逗號分隔)                    |
| `keyword`| string   | ❌   | 關鍵字搜尋 (名稱、帳號、Email、手機號碼)    |

**Request 範例:**

```
GET /user?page=1&limit=20&keyword=admin&roleIds=1,2
```

**Response 格式:**

```typescript
interface ResourceListEntity<T> {
  /** 資料列表 */
  data: T[];
  /** 分頁資訊 */
  meta: {
    /** 當前頁碼 */
    page: number;
    /** 每頁筆數 */
    limit: number;
    /** 總筆數 */
    total: number;
    /** 總頁數 */
    totalPages: number;
  };
}
```

**Response 範例 (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "管理員",
      "email": "admin@example.com",
      "phone": "0912345678",
      "isValid": true,
      "isEnabled": true,
      "userAccount": {
        "id": 1,
        "account": "admin001",
        "type": "NORMAL",
        "lastLoginAt": "2025-01-17T10:00:00.000Z"
      },
      "role": {
        "id": 1,
        "name": "系統管理員"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

#### 2.2.4 取得單一後台使用者資料

**端點:** `GET /user/:userId`

**說明:** 查詢單一使用者的詳細資訊

**Path 參數:**

| 參數名稱 | 類型   | 必填 | 說明       |
| -------- | ------ | ---- | ---------- |
| `userId` | number | ✅   | 使用者 ID  |

**Response:** UserEntity

---

#### 2.2.5 修改後台使用者資料

**端點:** `PATCH /user/:userId`

**說明:** 更新使用者的基本資料和角色

**Path 參數:**

| 參數名稱 | 類型   | 必填 | 說明       |
| -------- | ------ | ---- | ---------- |
| `userId` | number | ✅   | 使用者 ID  |

**Request 格式:**

```typescript
interface UpdateUserDto {
  /** 後台使用者名稱 (選填) */
  name?: string;
  /** 手機 (選填) */
  phone?: string;
  /** Email (選填) */
  email?: string;
  /** 是否已啟用 (選填) */
  isEnabled?: boolean;
  /** 角色 (選填) */
  role?: {
    /** 角色 ID */
    id: number;
  };
}
```

**Response:** UserEntity

---

#### 2.2.6 刪除後台使用者資料

**端點:** `DELETE /user/:userId`

**說明:** 軟刪除使用者帳號

**Path 參數:**

| 參數名稱 | 類型   | 必填 | 說明       |
| -------- | ------ | ---- | ---------- |
| `userId` | number | ✅   | 使用者 ID  |

**Response:** `204 No Content`

---

#### 2.2.7 重置後台使用者密碼

**端點:** `POST /user/:userId/action/reset-password`

**說明:** 管理員重置指定使用者的密碼

**Path 參數:**

| 參數名稱 | 類型   | 必填 | 說明       |
| -------- | ------ | ---- | ---------- |
| `userId` | number | ✅   | 使用者 ID  |

**Request 格式:**

```typescript
interface ResetPasswordDto {
  /** 新密碼 */
  newPassword: string;
}
```

**Response:** `204 No Content`

---

#### 2.2.8 驗證使用者權限

**端點:** `POST /user/:userId/action/check-permission`

**說明:** 檢查使用者是否擁有指定的權限

**Path 參數:**

| 參數名稱 | 類型   | 必填 | 說明       |
| -------- | ------ | ---- | ---------- |
| `userId` | number | ✅   | 使用者 ID  |

**Request 格式:**

```typescript
interface CheckPermissionDto {
  /** 權限列表 */
  permissions: string[];
}
```

**Request 範例:**

```json
{
  "permissions": ["USER__VIEW", "USER__CREATE"]
}
```

**Response:** `204 No Content` (有權限) 或 `403 Forbidden` (無權限)

---

### 2.3 認證相關 API (/user-auth)

#### 2.3.1 後台使用者註冊

**端點:** `POST /user-auth/register`

**說明:** 使用者註冊帳號並接收 Email 驗證碼

**Request 格式:**

```typescript
interface RegisterDto {
  /** 帳號 (必填) */
  account: string;
  /** 密碼 (必填) */
  password: string;
  /** 後台使用者名稱 (必填) */
  name: string;
  /** 手機 (必填) */
  phone: string;
  /** Email (必填) */
  email: string;
}
```

**Request 範例:**

```json
{
  "account": "user001",
  "password": "password123",
  "name": "一般使用者",
  "phone": "0912345678",
  "email": "user@example.com"
}
```

**Response 格式:**

```typescript
interface RegisterEntity {
  /** 使用者 ID */
  id: number;
  /** 使用者名稱 */
  name: string;
  /** Email */
  email: string;
  /** 驗證 Token */
  token: string;
}
```

**Response 範例 (200 OK):**

```json
{
  "id": 1,
  "name": "一般使用者",
  "email": "user@example.com",
  "token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123ghi456"
}
```

---

#### 2.3.2 重新發送註冊驗證碼

**端點:** `POST /user-auth/resend-register-code`

**說明:** 重新發送註冊驗證碼到 Email

**Request 格式:**

```typescript
interface ResendVerifyDto {
  /** 驗證 Token */
  token: string;
}
```

**Response:** `204 No Content`

---

#### 2.3.3 驗證註冊驗證碼

**端點:** `POST /user-auth/verify`

**說明:** 驗證 Email 驗證碼並啟用帳號

**Request 格式:**

```typescript
interface VerifyDto {
  /** 驗證 Token */
  token: string;
  /** 驗證碼 */
  code: string;
}
```

**Request 範例:**

```json
{
  "token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123ghi456",
  "code": "123456"
}
```

**Response 格式:**

```typescript
interface TokenEntity {
  /** 生成時間 (Unix timestamp) */
  iat: number;
  /** 過期時間 (Unix timestamp) */
  exp: number;
  /** 刷新過期時間 (Unix timestamp, 0 為無期限) */
  refreshExp: number;
  /** JWT Token */
  token: string;
}
```

**Response 範例 (200 OK):**

```json
{
  "iat": 1705468800,
  "exp": 1705555200,
  "refreshExp": 1706073600,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiLkuIDoiKzkvb_nlKjogIUiLCJyZWZyZXNoRXhwIjoxNzA2MDczNjAwLCJpYXQiOjE3MDU0Njg4MDAsImV4cCI6MTcwNTU1NTIwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

#### 2.3.4 後台使用者登入

**端點:** `POST /user-auth/login`

**說明:** 使用帳號密碼登入系統

**Request 格式:**

```typescript
interface LoginDto {
  /** 帳號 */
  account: string;
  /** 密碼 */
  password: string;
}
```

**Request 範例:**

```json
{
  "account": "admin001",
  "password": "password123"
}
```

**Response:** TokenEntity

---

#### 2.3.5 第三方會員登入

**端點:** `POST /user-auth/third-party-login`

**說明:** 使用 Google 或 Line 帳號登入

**Request 格式:**

```typescript
interface ThirdPartyLoginDto {
  /** 第三方登入類型 */
  type: 'GOOGLE' | 'LINE';
  /** 第三方 Token (Google: idToken, Line: accessToken) */
  token: string;
  /** 平台 (Google 登入必填) */
  platform?: 'WEB' | 'IOS' | 'ANDROID';
}
```

**Request 範例:**

```json
{
  "type": "GOOGLE",
  "token": "google-id-token",
  "platform": "WEB"
}
```

**Response:** TokenEntity

---

#### 2.3.6 取得登入者資訊

**端點:** `GET /user-auth/profile`

**說明:** 取得當前登入使用者的個人資料

**Headers:**

```
Authorization: Bearer <JWT Token>
```

**Response 格式:**

```typescript
interface ProfileEntity {
  /** 使用者 ID */
  id: number;
  /** 建立時間 */
  createdAt: Date;
  /** 更新時間 */
  updatedAt: Date;
  /** 後台使用者名稱 */
  name: string;
  /** 手機 */
  phone: string;
  /** Email */
  email: string;
  /** 是否已驗證 */
  isValid: boolean;
  /** 是否為超級管理員帳號 */
  isRoot: boolean;
  /** 帳號資訊 */
  userAccount: {
    /** 帳號 ID */
    id: number;
    /** 帳號 */
    account: string;
    /** 帳號類型 */
    type: string;
    /** 最後登入時間 */
    lastLoginAt: Date | null;
  };
}
```

---

#### 2.3.7 更新登入者資訊

**端點:** `PUT /user-auth/profile`

**說明:** 更新當前登入使用者的個人資料

**Headers:**

```
Authorization: Bearer <JWT Token>
```

**Request 格式:**

```typescript
interface UpdateProfileDto {
  /** 後台使用者名稱 (選填) */
  name?: string;
  /** 手機 (選填) */
  phone?: string;
  /** Email (選填) */
  email?: string;
}
```

**Response:** ProfileEntity

---

#### 2.3.8 更新登入者密碼

**端點:** `POST /user-auth/change-password`

**說明:** 使用者更新自己的密碼

**Headers:**

```
Authorization: Bearer <JWT Token>
```

**Request 格式:**

```typescript
interface UpdatePasswordDto {
  /** 舊密碼 */
  oldPassword: string;
  /** 新密碼 */
  newPassword: string;
}
```

**Response:** `204 No Content`

---

#### 2.3.9 驗證 Token

**端點:** `POST /user-auth/verify-token`

**說明:** 驗證 JWT Token 是否有效

**Request 格式:**

```typescript
interface VerifyTokenDto {
  /** JWT Token */
  token: string;
}
```

**Response:** TokenEntity

---

#### 2.3.10 刷新 Token

**端點:** `POST /user-auth/refresh-token`

**說明:** 使用 Refresh Token 機制刷新 JWT Token

**Request 格式:**

```typescript
interface RefreshTokenDto {
  /** 已過期或即將過期的 JWT Token */
  token: string;
}
```

**Response:** TokenEntity

---

#### 2.3.11 忘記密碼 - 取得驗證碼

**端點:** `POST /user-auth/forget-password-token`

**說明:** 透過 Email 或 SMS 接收驗證碼

**Request 格式:**

```typescript
interface ForgetPasswordTokenDto {
  /** 發送方式 */
  method: 'EMAIL' | 'SMS';
  /** 目標 (Email 或手機號碼) */
  target: string;
}
```

**Request 範例:**

```json
{
  "method": "EMAIL",
  "target": "user@example.com"
}
```

**Response 格式:**

```typescript
interface ForgetPasswordEntity {
  /** 驗證 Token */
  token: string;
}
```

---

#### 2.3.12 忘記密碼 - 重新發送驗證碼

**端點:** `POST /user-auth/forget-password-resend`

**說明:** 重新發送忘記密碼驗證碼

**Request 格式:**

```typescript
interface ForgetPasswordResendDto {
  /** 發送方式 */
  method: 'EMAIL' | 'SMS';
  /** 驗證 Token */
  token: string;
}
```

**Response:** `204 No Content`

---

#### 2.3.13 忘記密碼 - 驗證驗證碼

**端點:** `POST /user-auth/forget-password-verify`

**說明:** 驗證忘記密碼驗證碼

**Request 格式:**

```typescript
interface ForgetPasswordVerifyDto {
  /** 驗證 Token */
  token: string;
  /** 驗證碼 */
  code: string;
}
```

**Response 格式:**

```typescript
interface ForgetPasswordVerifyEntity {
  /** 重置密碼用的 Token */
  token: string;
}
```

---

#### 2.3.14 忘記密碼 - 重置密碼

**端點:** `POST /user-auth/forget-password-reset`

**說明:** 重置密碼

**Request 格式:**

```typescript
interface ForgetPasswordResetDto {
  /** 重置密碼用的 Token */
  token: string;
  /** 新密碼 */
  password: string;
}
```

**Response:** `204 No Content`

---

#### 2.3.15 取得登入者權限

**端點:** `GET /user-auth/permission`

**說明:** 取得當前登入使用者的角色和權限列表

**Headers:**

```
Authorization: Bearer <JWT Token>
```

**Response 格式:**

```typescript
interface UserRolePermissionEntity {
  /** 角色列表 */
  roles: Array<{
    /** 角色 ID */
    id: number;
    /** 角色名稱 */
    name: string;
  }>;
  /** 權限列表 */
  permissions: Array<{
    /** 權限名稱 */
    name: string;
  }>;
}
```

**Response 範例 (200 OK):**

```json
{
  "roles": [
    {
      "id": 1,
      "name": "系統管理員"
    }
  ],
  "permissions": [
    { "name": "USER__VIEW" },
    { "name": "USER__CREATE" },
    { "name": "USER__UPDATE" },
    { "name": "USER__DELETE" }
  ]
}
```

---

### 2.4 狀態碼定義

| HTTP Status | 說明                 | 使用情境                           |
| ----------- | -------------------- | ---------------------------------- |
| 200         | OK                   | 請求成功                           |
| 201         | Created              | 資源建立成功                       |
| 204         | No Content           | 請求成功但無返回內容 (刪除、更新密碼) |
| 400         | Bad Request          | 請求參數錯誤或驗證失敗             |
| 401         | Unauthorized         | 未認證或 Token 無效                |
| 403         | Forbidden            | 無權限存取或使用者未啟用           |
| 404         | Not Found            | 找不到資源                         |
| 409         | Conflict             | 資源衝突 (如帳號已存在)            |
| 500         | Internal Server Error | 伺服器內部錯誤                     |

### 2.5 錯誤回應格式

所有錯誤回應遵循統一格式:

```typescript
interface ErrorResponse {
  /** HTTP 狀態碼 */
  statusCode: number;
  /** 錯誤類型 */
  error: string;
  /** 錯誤訊息 (可能為字串或字串陣列) */
  message: string | string[];
}
```

**範例 - 參數驗證錯誤 (400):**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "account should not be empty",
    "password should not be empty"
  ]
}
```

**範例 - 帳號已存在 (409):**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "此帳號已存在"
}
```

**範例 - Token 過期 (401):**

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token已過期或無效"
}
```

**範例 - 無權限 (403):**

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "後台使用者尚未啟用,無法登入"
}
```

---

## 3. 資料結構定義

### 3.1 資料庫 Schema

#### 3.1.1 User (後台使用者)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  name      String
  phone     String?
  email     String?
  isValid   Boolean  @default(false) @map("is_valid")
  isEnabled Boolean  @default(true) @map("is_enabled")
  isRoot    Boolean  @default(false) @map("is_root")

  userAccountId Int         @map("user_account_id")
  userAccount   UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)

  @@map("user")
}
```

**欄位說明:**

| 欄位名稱      | 類型    | 必填 | 預設值 | 說明                              |
| ------------- | ------- | ---- | ------ | --------------------------------- |
| `id`          | Int     | ✅   | 自動   | 主鍵 ID                           |
| `createdAt`   | DateTime| ✅   | now()  | 建立時間                          |
| `updatedAt`   | DateTime| ✅   | 自動   | 更新時間                          |
| `name`        | String  | ✅   | -      | 後台使用者名稱                    |
| `phone`       | String  | ❌   | null   | 手機號碼                          |
| `email`       | String  | ❌   | null   | Email                             |
| `isValid`     | Boolean | ✅   | false  | 是否已驗證 (註冊驗證後為 true)    |
| `isEnabled`   | Boolean | ✅   | true   | 是否已啟用 (未啟用的使用者無法登入)|
| `isRoot`      | Boolean | ✅   | false  | 是否為超級管理員                  |
| `userAccountId`| Int    | ✅   | -      | 關聯的 UserAccount ID             |

---

#### 3.1.2 UserAccount (使用者帳號)

```prisma
model UserAccount {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  type        String
  account     String
  password    String    @default("")
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

**欄位說明:**

| 欄位名稱      | 類型     | 必填 | 預設值 | 說明                    |
| ------------- | -------- | ---- | ------ | ----------------------- |
| `id`          | Int      | ✅   | 自動   | 主鍵 ID                 |
| `createdAt`   | DateTime | ✅   | now()  | 建立時間                |
| `updatedAt`   | DateTime | ✅   | 自動   | 更新時間                |
| `type`        | String   | ✅   | -      | 帳號類型 (NORMAL/GOOGLE/LINE) |
| `account`     | String   | ✅   | -      | 帳號                    |
| `password`    | String   | ✅   | ""     | 密碼 (加密後)           |
| `lastLoginAt` | DateTime | ❌   | null   | 最後登入時間            |

---

#### 3.1.3 Verification (驗證碼)

```prisma
model Verification {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  code     String
  isValid  Boolean   @default(true) @map("is_valid")
  expireAt DateTime  @map("expire_at")
  usedAt   DateTime? @map("used_at")

  userAccountId Int         @map("user_account_id")
  userAccount   UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)

  @@map("verification")
}
```

**欄位說明:**

| 欄位名稱      | 類型     | 必填 | 預設值 | 說明                    |
| ------------- | -------- | ---- | ------ | ----------------------- |
| `code`        | String   | ✅   | -      | 驗證碼 (6位數字)        |
| `isValid`     | Boolean  | ✅   | true   | 是否有效                |
| `expireAt`    | DateTime | ✅   | -      | 過期時間                |
| `usedAt`      | DateTime | ❌   | null   | 使用時間                |
| `userAccountId`| Int     | ✅   | -      | 關聯的 UserAccount ID   |

---

#### 3.1.4 VerifyToken (驗證 Token)

```prisma
model VerifyToken {
  type  String
  token String

  userAccountId Int         @map("user_account_id")
  userAccount   UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)

  @@id([userAccountId, type, token])
  @@unique([type, token])
  @@map("verify_token")
}
```

**欄位說明:**

| 欄位名稱      | 類型   | 必填 | 說明                                    |
| ------------- | ------ | ---- | --------------------------------------- |
| `type`        | String | ✅   | 驗證類型 (REGISTER/FORGET_PASSWORD/FORGET_PASSWORD_RESET) |
| `token`       | String | ✅   | 驗證 Token (64位隨機字串)               |
| `userAccountId`| Int   | ✅   | 關聯的 UserAccount ID                   |

---

#### 3.1.5 UserAccountHasRole (使用者角色關聯)

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

---

#### 3.1.6 UserAccountHasPermission (使用者權限關聯)

```prisma
model UserAccountHasPermission {
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  permission String

  userAccountId Int         @map("user_account_id")
  userAccount   UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)

  @@id([userAccountId, permission])
  @@map("user_account_has_permission")
}
```

---

### 3.2 資料關聯圖

```
UserAccount (使用者帳號)
  │
  ├──< 1:N >── User (後台使用者)
  │
  ├──< N:M >── Role (角色)
  │             └── via UserAccountHasRole
  │
  ├──< N:M >── Permission (權限)
  │             └── via UserAccountHasPermission
  │
  ├──< 1:N >── Verification (驗證碼)
  │
  ├──< 1:N >── VerifyToken (驗證 Token)
  │
  ├──< 1:N >── SendSmsLog (簡訊發送記錄)
  │
  └──< 1:N >── SendMailLog (郵件發送記錄)
```

---

### 3.3 Entity 定義

#### 3.3.1 UserEntity

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class UserAccountEntity {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'account' })
  @Expose()
  account!: string;

  @ApiProperty({ enum: AccountType })
  @Expose()
  type!: AccountType;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @Expose()
  lastLoginAt!: Date | null;

  @Expose({ toClassOnly: true })
  @Type(() => UserAccountHasRoleEntity)
  userAccountHasRole!: UserAccountHasRoleEntity[];
}

@Exclude()
export class UserEntity {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ description: '後台使用者名稱', example: '後台使用者名稱' })
  @Expose()
  name!: string;

  @ApiProperty({ description: '手機', example: '0912345678' })
  @Expose()
  phone!: string | null;

  @ApiProperty({ description: 'Email', example: 'example@mail.com' })
  @Expose()
  email!: string | null;

  @ApiProperty({ description: '是否已驗證' })
  @Expose()
  isValid!: boolean;

  @ApiProperty({ description: '是否已啟用' })
  @Expose()
  isEnabled!: boolean;

  @ApiProperty({ type: UserAccountEntity })
  @Expose()
  @Type(() => UserAccountEntity)
  userAccount!: UserAccountEntity;

  @ApiProperty({ type: RoleEntity })
  @Expose()
  role() {
    return head(this.userAccount.userAccountHasRole)?.role ?? null;
  }

  isRoot!: boolean;
}
```

---

#### 3.3.2 TokenEntity

```typescript
@Exclude()
export class TokenEntity {
  @ApiProperty({ description: '生成時間' })
  @Expose()
  iat!: number;

  @ApiProperty({ description: '過期時間' })
  @Expose()
  exp!: number;

  @ApiProperty({ description: '刷新過期時間(0為無期限)' })
  @Expose()
  refreshExp!: number;

  @ApiProperty({ example: 'token' })
  @Expose()
  token!: string;
}
```

---

### 3.4 DTO 定義

#### 3.4.1 CreateUserDto

```typescript
export class RoleDto {
  @ApiProperty({ description: '角色id', example: 1 })
  @IsNotEmpty()
  @IsInt()
  id!: number;
}

export class CreateUserDto {
  @ApiProperty({ description: '帳號', example: 'account' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ description: '密碼', example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({ description: '後台使用者名稱', example: '後台使用者名稱' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: '手機', example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email', example: 'example@mail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsBoolean()
  isValid: boolean = true;

  @ApiProperty({ description: '是否已啟用', default: true })
  @IsBoolean()
  isEnabled: boolean = true;

  @ApiProperty({ type: RoleDto })
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => RoleDto)
  role!: RoleDto;
}
```

---

#### 3.4.2 LoginDto

```typescript
export class LoginDto {
  @ApiProperty({ example: 'account' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
```

---

#### 3.4.3 RegisterDto

```typescript
export class RegisterDto {
  @ApiProperty({ description: '帳號', example: 'account' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ description: '密碼', example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({ description: '後台使用者名稱', example: '後台使用者名稱' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: '手機', example: '0912345678' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Email', example: 'example@mail.com' })
  @IsNotEmpty()
  @IsString()
  email!: string;
}
```

---

### 3.5 Enum 定義

#### 3.5.1 VerifyType (驗證類型)

```typescript
export enum VerifyType {
  /** 註冊驗證 */
  REGISTER = 'register',
  /** 忘記密碼驗證 */
  FORGET_PASSWORD = 'forgetPassword',
  /** 忘記密碼重置 */
  FORGET_PASSWORD_RESET = 'forgetPasswordReset',
}
```

---

#### 3.5.2 MessageSendMethod (訊息發送方式)

```typescript
export enum MessageSendMethod {
  /** Email */
  EMAIL = 'email',
  /** 簡訊 */
  SMS = 'sms',
}
```

---

#### 3.5.3 ThirdPartyLoginType (第三方登入類型)

```typescript
export enum ThirdPartyLoginType {
  /** Google 登入 */
  GOOGLE = 'GOOGLE',
  /** Line 登入 */
  LINE = 'LINE',
}
```

---

#### 3.5.4 ForgetPasswordSendMethod (忘記密碼發送方式)

```typescript
export enum ForgetPasswordSendMethod {
  /** Email */
  EMAIL = 'EMAIL',
  /** 簡訊 */
  SMS = 'SMS',
}
```

---

## 4. 業務邏輯設計

### 4.1 Service 層設計

#### 4.1.1 UserService (使用者管理服務)

**職責:**
- 使用者 CRUD 操作
- 使用者查詢與篩選
- 使用者權限查詢

**核心方法:**

```typescript
export class UserService {
  /**
   * 建立後台使用者
   * @param createUserDto 建立使用者 DTO
   * @param include Prisma include 選項
   * @returns 建立的使用者資料
   */
  async create(
    createUserDto: CreateUserDto,
    include?: Prisma.UserInclude
  ): Promise<User>;

  /**
   * 建立超級管理員
   * @param dto 建立超級管理員 DTO
   * @param include Prisma include 選項
   * @returns 建立的使用者資料
   */
  async createRoot(
    dto: CreateRootUserDto,
    include?: Prisma.UserInclude
  ): Promise<User>;

  /**
   * 查詢使用者列表 (分頁)
   * @param params 查詢參數
   * @returns 分頁查詢結果
   */
  pagination(params: {
    page?: number;
    limit?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }): Promise<PaginationResult<User>>;

  /**
   * 查詢單一使用者
   * @param where 查詢條件
   * @param include Prisma include 選項
   * @returns 使用者資料或 null
   */
  findOne(
    where: Prisma.UserWhereUniqueInput,
    include?: Prisma.UserInclude
  ): Promise<User | null>;

  /**
   * 更新使用者資料
   * @param where 查詢條件
   * @param updateUserDto 更新 DTO
   * @param include Prisma include 選項
   * @returns 更新後的使用者資料
   */
  async update(
    where: Prisma.UserWhereUniqueInput,
    updateUserDto: UpdateUserDto,
    include?: Prisma.UserInclude
  ): Promise<User>;

  /**
   * 刪除使用者 (軟刪除)
   * @param where 查詢條件
   */
  async remove(where: Prisma.UserWhereUniqueInput): Promise<void>;

  /**
   * 取得使用者角色權限
   * @param userAccountId 使用者帳號 ID
   * @returns 角色與權限列表
   */
  async getRolePermissions(
    userAccountId: number
  ): Promise<UserRolePermissionEntity>;
}
```

**實作重點:**

1. **Transaction 保護**:所有涉及多表操作的方法都使用 `$transaction` 確保原子性
2. **軟刪除**:刪除使用者時實際刪除 UserAccount,透過 Cascade 自動刪除關聯的 User
3. **角色驗證**:建立/更新使用者前,必須先驗證角色是否存在
4. **超級管理員處理**:一般列表查詢會過濾掉 `isRoot=true` 的使用者

---

#### 4.1.2 UserAuthService (認證服務)

**職責:**
- 使用者註冊與驗證
- 登入認證
- 第三方登入處理
- JWT Token 生成與驗證
- Token 刷新機制
- 忘記密碼流程

**核心方法:**

```typescript
export class UserAuthService {
  /**
   * 註冊後台使用者 (需驗證)
   * @param registerDto 註冊 DTO
   * @returns 建立的使用者資料
   */
  async registerWithVerification(
    registerDto: RegisterWithOrgIdDto
  ): Promise<User>;

  /**
   * 驗證驗證碼
   * @param verifyDto 驗證 DTO
   */
  async verify(verifyDto: VerifyWithTypeDto): Promise<void>;

  /**
   * 生成 JWT Token
   * @param params userAccountId
   * @returns JWT Token 字串
   */
  async getJwtToken(params: { userAccountId: number }): Promise<string>;

  /**
   * 刷新 JWT Token
   * @param refreshTokenDto 刷新 Token DTO
   * @returns 新的 JWT Token
   */
  async refreshJwtToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<string>;

  /**
   * 驗證 JWT Token
   * @param token JWT Token
   * @param options 驗證選項
   * @returns 是否有效
   */
  async verifyJwtToken(
    token: string,
    options?: JwtVerifyOptions
  ): Promise<boolean>;

  /**
   * 第三方登入
   * @param dto 第三方登入 DTO
   * @returns 建立或取得的使用者資料
   */
  async thirdPartyLogin(
    dto: ThirdPartyLoginWithOrgIdDto
  ): Promise<User>;

  /**
   * 生成驗證碼並發送
   * @param dto 生成驗證碼 DTO
   */
  async generateVerificationAndSend(
    dto: GenerateVerificationAndSendDto
  ): Promise<void>;

  /**
   * 檢查帳號是否存在
   * @param account 帳號
   * @throws 如果帳號已存在且已驗證,拋出異常
   */
  async checkAccountExists(account: string): Promise<void>;
}
```

**核心演算法說明:**

**1. JWT Token 生成**

```typescript
async getJwtToken(params: { userAccountId: number }): Promise<string> {
  const { userAccountId } = params;
  const user = await this.prisma.user.findFirst({ where: { userAccountId } });

  if (!user) abort('找無此後台使用者');

  const { refreshExpires } = this.configService.getOrThrow<JwtConfigInterface>('jwt');

  const token = await this.jwtService.signAsync({
    sub: user.userAccountId.toString(),
    username: user.name,
    refreshExp: refreshExpires === 0
      ? 0
      : ((new Date().getTime() / 1000) | 0) + refreshExpires,
  }, {
    expiresIn: expires
  });

  return token;
}
```

**2. Token 刷新機制**

```typescript
async refreshJwtToken(refreshTokenDto: RefreshTokenDto): Promise<string> {
  const { token } = refreshTokenDto;

  // 1. 驗證 Token (忽略過期)
  await this.verifyJwtTokenOrThrow(token, { ignoreExpiration: true });

  // 2. 取得 Token Payload
  const { sub, username, refreshExp } = await this.getJwtPayload(token, {
    ignoreExpiration: true,
  });

  // 3. 檢查 refreshExp 是否過期
  if (refreshExp !== 0 && refreshExp < ((new Date().getTime() / 1000) | 0)) {
    abort('刷新時效已過期', HttpStatus.UNAUTHORIZED);
  }

  // 4. 生成新 Token (保留原 refreshExp)
  const newToken = await this.getToken({
    sub,
    username,
    refreshExp,
  });

  return newToken;
}
```

**3. 第三方登入處理**

```typescript
async thirdPartyLogin(dto: ThirdPartyLoginWithOrgIdDto): Promise<User> {
  const { type, token, platform } = dto;

  // 1. 驗證第三方 Token 並取得使用者資料
  let userAccount: UserAccountEntity;
  let payload: { name: string; email?: string; phone?: string };

  switch (type) {
    case ThirdPartyLoginType.GOOGLE:
      userAccount = await this.googleLoginService.login({
        platform,
        idToken: token,
        orgId,
      });
      const googlePayload = await this.googleLoginService.getPayload({
        platform,
        idToken: token,
      });
      payload = {
        name: googlePayload.name ?? '系統產生',
        email: googlePayload.email,
      };
      break;

    case ThirdPartyLoginType.LINE:
      userAccount = await this.lineLoginService.login({
        accessToken: token,
        orgId,
      });
      const linePayload = await this.lineLoginService.getUserProfile(token);
      payload = {
        name: linePayload.displayName ?? '系統產生',
      };
      break;
  }

  // 2. 建立或取得 User
  return this.prisma.$transaction(async (tx) => {
    const { name, email, phone } = payload;
    const data: Prisma.UserCreateInput = {
      phone,
      email,
      name,
      isValid: true,
      userAccount: { connect: { id: userAccount.id } },
    };

    const [user] = await tx.user.findFirstOrCreate({
      where: { userAccountId: userAccount.id },
      data,
    });

    return user;
  });
}
```

---

#### 4.1.3 VerifyTokenService (驗證 Token 服務)

**職責:**
- 管理 VerifyToken (註冊、忘記密碼等流程使用的 Token)
- Token 的建立、查詢、刪除

**核心方法:**

```typescript
export class VerifyTokenService {
  /**
   * 建立驗證 Token
   * @param params type 和 userAccountId
   * @returns 建立的 VerifyToken
   */
  async create(params: {
    type: VerifyType;
    userAccountId: number;
  }): Promise<VerifyToken>;

  /**
   * 查詢驗證 Token (找不到會拋出異常)
   * @param where 查詢條件
   * @returns VerifyToken
   * @throws 找不到時拋出 404
   */
  async findOrThrow(where: Prisma.VerifyTokenWhereInput): Promise<VerifyToken>;

  /**
   * 刪除驗證 Token
   * @param where 刪除條件
   */
  async delete(where: Prisma.VerifyTokenWhereUniqueInput): Promise<void>;
}
```

---

### 4.2 Controller 層設計

Controller 層職責:
- 接收 HTTP 請求
- 驗證請求參數 (透過 DTO)
- 呼叫 Service 層執行業務邏輯
- 轉換並返回回應 (透過 Entity)

**設計原則:**

1. **不包含業務邏輯**:Controller 不直接操作資料庫,只負責請求/回應處理
2. **使用 DTO 驗證**:所有請求參數都透過 DTO 進行驗證
3. **使用 Entity 回應**:所有回應都透過 `plainToInstance` 轉換為 Entity
4. **統一錯誤處理**:錯誤由全域異常過濾器統一處理
5. **Swagger 文檔完整**:每個端點都有完整的 API 文檔

**範例:**

```typescript
@ApiTags('後台使用者管理')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  @ApiOperation({ summary: '建立後台使用者資料' })
  @ApiOkResponse({ type: UserEntity })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const { role } = createUserDto;

    // 驗證角色是否存在
    await this.roleService.existsOrThrow({ id: role.id, deletedAt: null });

    // 呼叫 Service 建立使用者
    const user = await this.userService.create(createUserDto, this.defaultInclude);

    // 轉換並返回 Entity
    return plainToInstance(UserEntity, user);
  }
}
```

---

## 5. 錯誤處理機制

### 5.1 統一錯誤處理函數

#### 5.1.1 abort() 函數

用於主動拋出 HTTP 異常:

```typescript
/**
 * 拋出 HTTP 異常
 * @param message 錯誤訊息
 * @param status HTTP 狀態碼 (預設 400)
 */
export function abort(
  message: string,
  status: HttpStatus = HttpStatus.BAD_REQUEST,
): never {
  throw new HttpException(message, status);
}
```

**使用範例:**

```typescript
// 拋出 400 錯誤
abort('參數錯誤');

// 拋出 404 錯誤
abort('找無此資源', HttpStatus.NOT_FOUND);

// 拋出 401 錯誤
abort('未授權', HttpStatus.UNAUTHORIZED);
```

---

#### 5.1.2 catchPrismaErrorOrThrow() 函數

用於處理 Prisma 資料庫錯誤:

```typescript
/**
 * 捕獲 Prisma 錯誤並轉換為 HTTP 異常
 * @param entityName 實體名稱
 * @returns 錯誤處理函數
 */
export function catchPrismaErrorOrThrow(entityName: string) {
  return (err: unknown) => {
    dealWithPrismaClientError(err, entityName);
    throw err;
  };
}
```

**使用範例:**

```typescript
// 在 Service 中使用
const user = await this.prisma.$transaction(async (tx) => {
  return await tx.user.create({ data, include });
})
.catch(catchPrismaErrorOrThrow('後台使用者'));
```

---

### 5.2 常見錯誤處理模式

#### 5.2.1 資源不存在處理

```typescript
async findOrThrow(id: number): Promise<User> {
  const user = await this.prisma.user.findFirst({ where: { id } });

  if (!user) {
    abort(`找無此後台使用者(id: ${id})`, HttpStatus.NOT_FOUND);
  }

  return user;
}
```

---

#### 5.2.2 帳號已存在處理

```typescript
async checkAccountExists(account: string): Promise<void> {
  const userAccount = await this.userAccountService.findByAccount(account);
  const user = userAccount
    ? await this.prisma.user.findFirst({
        where: { userAccountId: userAccount.id },
      })
    : null;

  if (user && user.isValid) {
    abort('此帳號已存在', HttpStatus.CONFLICT);
  }
}
```

---

#### 5.2.3 權限驗證失敗處理

```typescript
async checkPermission(userId: number, permissions: string[]): Promise<void> {
  const user = await this.userService.findFirstOrThrow({ id: userId });

  // 超級管理員跳過權限檢查
  if (user.isRoot) return;

  // 檢查權限
  const hasPermission = await this.permissionService.checkByUser(
    user.userAccountId,
    permissions,
  );

  if (!hasPermission) {
    abort('無權限執行此操作', HttpStatus.FORBIDDEN);
  }
}
```

---

#### 5.2.4 Token 驗證失敗處理

```typescript
async verifyJwtTokenOrThrow(
  token: string,
  options?: JwtVerifyOptions,
): Promise<boolean> {
  const isValid = await this.verifyJwtToken(token, options);

  if (!isValid) {
    abort('Token已過期或無效', HttpStatus.UNAUTHORIZED);
  }

  return isValid;
}
```

---

### 5.3 錯誤回應格式

所有錯誤都遵循統一的回應格式:

```typescript
{
  "statusCode": number,
  "error": string,
  "message": string | string[]
}
```

**範例:**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "找無此後台使用者(id: 999)"
}
```

---

## 6. 安全性設計

### 6.1 認證機制 (Authentication)

#### 6.1.1 JWT Token 認證

**Token 結構:**

```typescript
interface JwtPayload {
  /** 使用者帳號 ID */
  sub: string;
  /** 使用者名稱 */
  username: string;
  /** 刷新過期時間 (Unix timestamp, 0 為無期限) */
  refreshExp: number;
  /** 生成時間 (Unix timestamp) */
  iat: number;
  /** 過期時間 (Unix timestamp) */
  exp: number;
}
```

**Token 驗證流程:**

1. 前端在 HTTP Header 中加入 `Authorization: Bearer <token>`
2. `UserAuthGuard` 攔截請求並驗證 Token
3. 解析 Token Payload,取得使用者資訊
4. 將使用者資訊注入到 Request 中
5. Controller 可透過 `@AuthData()` 裝飾器取得使用者資訊

**實作範例:**

```typescript
// user-auth.guard.ts
@Injectable()
export class UserAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供 Token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['authData'] = { token, payload };
    } catch {
      throw new UnauthorizedException('Token 無效或已過期');
    }

    return true;
  }
}
```

---

#### 6.1.2 認證裝飾器

**@UseAuth() - 需要認證的端點**

```typescript
@UseAuth()
@Get('profile')
async getProfile(@AuthData() authData: AuthDataConfig) {
  const { payload } = authData;
  const user = await this.userService.findOne({ id: parseInt(payload.sub) });
  return plainToInstance(ProfileEntity, user);
}
```

**@UserAuthPublic() - 公開端點 (不需認證)**

```typescript
@UserAuthPublic()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // 登入邏輯...
}
```

---

### 6.2 授權機制 (Authorization)

#### 6.2.1 基於角色的權限控制 (RBAC)

**權限檢查流程:**

```
1. 取得使用者的 userAccountId
   ↓
2. 檢查是否為超級管理員 (isRoot=true)
   ├─ 是 → 允許所有操作
   └─ 否 → 繼續
   ↓
3. 查詢使用者的角色 (UserAccountHasRole)
   ↓
4. 查詢角色的權限 (RoleHasPermission)
   ↓
5. 檢查是否擁有所需權限
   ├─ 是 → 允許操作
   └─ 否 → 拋出 403 Forbidden
```

**實作範例:**

```typescript
async checkByUser(
  userAccountId: number,
  permissions: string[],
): Promise<void> {
  // 1. 查詢使用者
  const user = await this.prisma.user.findFirst({
    where: { userAccountId },
  });

  if (!user) abort('找無此使用者', HttpStatus.NOT_FOUND);

  // 2. 超級管理員跳過檢查
  if (user.isRoot) return;

  // 3. 取得使用者權限
  const userPermissions = await this.getByUser(userAccountId);

  // 4. 檢查是否擁有所需權限
  const hasPermission = permissions.every(p =>
    userPermissions.includes(p)
  );

  if (!hasPermission) {
    abort('無權限執行此操作', HttpStatus.FORBIDDEN);
  }
}
```

---

### 6.3 密碼安全

#### 6.3.1 密碼加密

使用 bcrypt 進行密碼加密:

```typescript
import * as bcrypt from 'bcrypt';

// 加密密碼 (10 rounds)
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// 驗證密碼
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

**安全要求:**

- Salt Rounds: 10 (最少)
- 密碼不得以明文儲存
- 密碼不得出現在 API 回應中
- 密碼錯誤訊息統一返回「帳號或密碼錯誤」,避免洩漏帳號資訊

---

#### 6.3.2 密碼複雜度要求

建議前端實作以下密碼複雜度驗證:

- 最小長度: 8 字元
- 至少包含一個大寫字母
- 至少包含一個小寫字母
- 至少包含一個數字
- 至少包含一個特殊字元 (可選)

---

### 6.4 防護機制

#### 6.4.1 SQL Injection 防護

使用 Prisma ORM,所有查詢都經過參數化,自動防止 SQL Injection:

```typescript
// ✅ 安全:參數化查詢
const user = await this.prisma.user.findFirst({
  where: { account: userInput }
});

// ❌ 危險:字串拼接 (不要這樣做)
const user = await this.prisma.$queryRaw`
  SELECT * FROM user WHERE account = '${userInput}'
`;
```

---

#### 6.4.2 XSS 防護

- 使用 `class-transformer` 的 `@Expose()` 控制回應欄位
- 敏感資料(如密碼)不出現在 API 回應中
- 前端應對使用者輸入進行 sanitize

---

#### 6.4.3 CSRF 防護

- API 使用 JWT Token 認證,不依賴 Cookie
- 建議生產環境啟用 CORS 設定,限制允許的來源

---

#### 6.4.4 驗證碼安全

- 驗證碼長度: 6 位數字
- 過期時間: 10 分鐘
- 使用後立即刪除,防止重複使用
- 驗證碼儲存時加密 (可選)

---

## 7. 第三方服務整合

### 7.1 Google Mail Service

**功能:** 發送 Email 驗證碼

**使用場景:**
- 註冊驗證碼
- 忘記密碼驗證碼

**API 介面:**

```typescript
interface SendMailParams {
  /** 收件者 Email */
  to: string;
  /** 郵件主旨 */
  subject: string;
  /** 郵件內容 */
  message: string;
  /** 使用者帳號 ID (用於記錄) */
  userAccountId: number;
}

class GoogleMailService {
  async sendMail(params: SendMailParams): Promise<void>;
}
```

**使用範例:**

```typescript
await this.googleMailService.sendMail({
  to: user.email,
  subject: '後台使用者註冊驗證碼',
  message: `您的驗證碼為 ${code},請於10分鐘內進行驗證`,
  userAccountId: userAccount.id,
});
```

---

### 7.2 E8D SMS Service

**功能:** 發送簡訊驗證碼

**使用場景:**
- 忘記密碼驗證碼 (SMS 方式)

**API 介面:**

```typescript
interface SendSmsParams {
  /** 收件者手機號碼 */
  DEST: string;
  /** 簡訊主旨 */
  SB: string;
  /** 簡訊內容 */
  MSG: string;
  /** 簡訊類型 */
  ST: string;
  /** 使用者帳號 ID (用於記錄) */
  userAccountId: number;
}

class E8dSmsService {
  async sendSms(params: SendSmsParams): Promise<void>;
}
```

**使用範例:**

```typescript
await this.e8dSmsService.sendSms({
  DEST: user.phone,
  SB: '後台使用者忘記密碼驗證碼',
  MSG: `您的驗證碼為 ${code},請於10分鐘內進行驗證`,
  ST: '',
  userAccountId: userAccount.id,
});
```

---

### 7.3 Google Login Service

**功能:** Google 第三方登入

**使用場景:**
- 使用者使用 Google 帳號登入

**API 介面:**

```typescript
interface GoogleLoginParams {
  /** 平台 */
  platform: 'WEB' | 'IOS' | 'ANDROID';
  /** Google ID Token */
  idToken: string;
  /** 組織 ID */
  orgId: number;
}

interface GooglePayload {
  /** 使用者名稱 */
  name: string;
  /** Email */
  email: string;
}

class GoogleLoginService {
  /**
   * Google 登入 (建立或取得 UserAccount)
   */
  async login(params: GoogleLoginParams): Promise<UserAccountEntity>;

  /**
   * 取得 Google 使用者資料
   */
  async getPayload(params: {
    platform: string;
    idToken: string;
  }): Promise<GooglePayload>;
}
```

**使用範例:**

```typescript
// 1. 驗證並建立/取得 UserAccount
const userAccount = await this.googleLoginService.login({
  platform: 'WEB',
  idToken: token,
  orgId: 0,
});

// 2. 取得使用者資料
const { name, email } = await this.googleLoginService.getPayload({
  platform: 'WEB',
  idToken: token,
});
```

---

### 7.4 Line Login Service

**功能:** Line 第三方登入

**使用場景:**
- 使用者使用 Line 帳號登入

**API 介面:**

```typescript
interface LineLoginParams {
  /** Line Access Token */
  accessToken: string;
  /** 組織 ID */
  orgId: number;
}

interface LineUserProfile {
  /** 使用者顯示名稱 */
  displayName: string;
}

class LineLoginService {
  /**
   * Line 登入 (建立或取得 UserAccount)
   */
  async login(params: LineLoginParams): Promise<UserAccountEntity>;

  /**
   * 取得 Line 使用者資料
   */
  async getUserProfile(accessToken: string): Promise<LineUserProfile>;
}
```

**使用範例:**

```typescript
// 1. 驗證並建立/取得 UserAccount
const userAccount = await this.lineLoginService.login({
  accessToken: token,
  orgId: 0,
});

// 2. 取得使用者資料
const { displayName } = await this.lineLoginService.getUserProfile(token);
```

---

## 8. 效能考量

### 8.1 資料庫查詢優化

#### 8.1.1 使用 Prisma Include

避免 N+1 查詢問題,使用 `include` 一次載入關聯資料:

```typescript
// ✅ 好的做法:一次查詢載入所有關聯
const user = await this.prisma.user.findFirst({
  where: { id },
  include: {
    userAccount: {
      include: {
        userAccountHasRole: {
          include: {
            role: true,
          },
        },
      },
    },
  },
});

// ❌ 壞的做法:多次查詢 (N+1 問題)
const user = await this.prisma.user.findFirst({ where: { id } });
const userAccount = await this.prisma.userAccount.findFirst({
  where: { id: user.userAccountId },
});
const roles = await this.prisma.userAccountHasRole.findMany({
  where: { userAccountId: userAccount.id },
});
```

---

#### 8.1.2 分頁查詢

所有列表查詢都應支援分頁,避免一次載入過多資料:

```typescript
const { result, ...meta } = await this.prisma.user.pagination({
  page: 1,
  limit: 20,
  where: { isRoot: false },
  orderBy: { createdAt: 'desc' },
  include: this.include,
});
```

---

#### 8.1.3 索引優化

在 Prisma Schema 中為常用查詢欄位建立索引:

```prisma
model UserAccount {
  id      Int    @id @default(autoincrement())
  account String @unique // ✅ 唯一索引
  type    String @db.Index // ✅ 一般索引

  @@map("user_account")
}
```

---

### 8.2 Token 過期時間設定

合理設定 Token 過期時間,平衡安全性與使用者體驗:

| Token 類型     | 建議過期時間 | 說明                          |
| -------------- | ------------ | ----------------------------- |
| JWT Token (exp)| 24 小時      | 一般操作的 Token 有效期       |
| Refresh Token  | 30 天        | 允許刷新 Token 的期限         |
| 驗證碼         | 10 分鐘      | 註冊、忘記密碼等驗證碼有效期  |

**環境變數設定:**

```env
JWT_EXPIRES=24h
JWT_REFRESH_EXPIRES=2592000  # 30天 (秒)
```

---

### 8.3 Transaction 使用

所有涉及多表操作的功能都使用 Transaction 確保資料一致性:

```typescript
const user = await this.prisma.$transaction(async (tx) => {
  // 1. 建立 UserAccount
  const userAccount = await this.userAccountService.create({
    account,
    password,
  });

  // 2. 關聯角色
  await this.userRoleService.updateRole({
    userAccountId: userAccount.id,
    role: [role],
  });

  // 3. 建立 User
  return await tx.user.create({
    data: {
      ...userData,
      userAccount: { connect: { id: userAccount.id } },
    },
  });
});
```

---

### 8.4 快取策略 (可選)

對於不常變動的資料,可考慮使用 Redis 快取:

- 使用者權限列表 (TTL: 5 分鐘)
- 角色權限對照表 (TTL: 10 分鐘)
- JWT Token 黑名單 (用於登出功能)

---

## 9. 範例代碼

### 9.1 完整的註冊流程實作

```typescript
// user-auth.controller.ts
@ApiOperation({ summary: '後台使用者註冊' })
@ApiOkResponse({ type: RegisterEntity })
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  const { account } = registerDto;
  const orgId = 0;

  // 1. 檢查帳號是否已存在
  await this.userAuthService.checkAccountExists(account);

  // 2. 建立後台使用者
  const user = await this.userAuthService.registerWithVerification({
    ...registerDto,
    orgId,
  });

  // 3. 發送驗證碼
  await this.userAuthService.generateVerificationAndSend({
    userAccountId: user.userAccountId,
    verifyType: VerifyType.REGISTER,
    sendMethod: MessageSendMethod.EMAIL,
  });

  // 4. 取得 VerifyToken
  const verifyToken = await this.verifyTokenService.findOrThrow({
    userAccountId: user.userAccountId,
    type: VerifyType.REGISTER,
  });

  return plainToInstance(RegisterEntity, {
    ...user,
    token: verifyToken.token,
  });
}
```

```typescript
// user-auth.service.ts
async registerWithVerification(
  registerDto: RegisterWithOrgIdDto
): Promise<User> {
  const { account, password, name, phone, email } = registerDto;

  return this.prisma.$transaction(async (tx) => {
    // 1. 建立或取得 UserAccount
    const userAccount = (await this.userAccountService.existsByAccount(account))
      ? await this.userAccountService.findByAccount(account)
      : await this.userAccountService.create({ account, password });

    // 2. 建立或更新 User
    const data: Prisma.UserCreateInput = {
      phone,
      email,
      name,
      userAccount: { connect: { id: userAccount.id } },
    };

    let user = await tx.user.findFirst({
      where: { userAccountId: userAccount.id },
    });

    if (user) {
      user = await tx.user.update({
        where: { id: user.id },
        data: { phone, email, name },
      });
    } else {
      user = await tx.user.create({ data });
    }

    // 3. 生成註冊驗證用 token
    const token = generateRandomString(64, ['LOWER', 'NUMBER']);
    await tx.verifyToken.findFirstOrCreate({
      where: {
        userAccountId: userAccount.id,
        type: VerifyType.REGISTER,
      },
      data: {
        type: VerifyType.REGISTER,
        token,
        userAccountId: userAccount.id,
      },
    });

    return user;
  });
}
```

---

### 9.2 完整的登入流程實作

```typescript
// user-auth.controller.ts
@ApiOperation({ summary: '後台使用者登入' })
@ApiOkResponse({ type: TokenEntity })
@Post('login')
async login(@Body() loginDto: LoginDto) {
  const { account, password } = loginDto;

  // 1. 取得後台使用者資訊
  const user = await this.userService.findByAccountOrThrow({ account })
    .catch(() => {
      abort('帳號或密碼錯誤', HttpStatus.UNAUTHORIZED);
    });

  // 2. 檢查是否啟用
  if (!user.isEnabled) {
    abort('後台使用者尚未啟用,無法登入', HttpStatus.FORBIDDEN);
  }

  // 3. 登入驗證
  const userAccount = await this.userAccountService.login({
    account,
    password,
  });

  // 4. 生成 JWT Token
  const token = await this.userAuthService.getJwtToken({
    userAccountId: userAccount.id,
  });

  return this.userAuthService.getTokenEntity(token);
}
```

```typescript
// user-account.service.ts
async login(params: {
  account: string;
  password: string;
}): Promise<UserAccount> {
  const { account, password } = params;

  // 1. 查詢帳號
  const userAccount = await this.prisma.userAccount.findFirst({
    where: { account },
  });

  if (!userAccount) {
    abort('帳號或密碼錯誤', HttpStatus.UNAUTHORIZED);
  }

  // 2. 驗證密碼
  const isMatch = await bcrypt.compare(password, userAccount.password);

  if (!isMatch) {
    abort('帳號或密碼錯誤', HttpStatus.UNAUTHORIZED);
  }

  // 3. 更新最後登入時間
  await this.prisma.userAccount.update({
    where: { id: userAccount.id },
    data: { lastLoginAt: new Date() },
  });

  return userAccount;
}
```

---

### 9.3 JWT Token 認證守衛實作

```typescript
// user-auth.guard.ts
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 檢查是否為公開 API
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    // 2. 取得 Token
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供 Token');
    }

    // 3. 驗證 Token
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // 4. 注入使用者資訊到 Request
      request['authData'] = {
        token,
        payload,
      };
    } catch {
      throw new UnauthorizedException('Token 無效或已過期');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

---

### 9.4 權限檢查實作

```typescript
// permission.service.ts
async checkByUser(
  userAccountId: number,
  permissions: string[],
): Promise<void> {
  // 1. 查詢使用者
  const user = await this.prisma.user.findFirst({
    where: { userAccountId },
  });

  if (!user) {
    abort('找無此使用者', HttpStatus.NOT_FOUND);
  }

  // 2. 超級管理員跳過檢查
  if (user.isRoot) return;

  // 3. 取得使用者權限
  const userPermissions = await this.getByUser(userAccountId);

  // 4. 檢查是否擁有所需權限
  const missingPermissions = permissions.filter(
    p => !userPermissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    abort(
      `缺少以下權限: ${missingPermissions.join(', ')}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

async getByUser(userAccountId: number): Promise<string[]> {
  // 查詢使用者的角色權限
  const roles = await this.prisma.userAccountHasRole.findMany({
    where: { userAccountId },
    include: {
      role: {
        include: {
          roleHasPermission: true,
        },
      },
    },
  });

  // 提取所有權限
  const permissions = roles.flatMap(({ role }) =>
    role.roleHasPermission.map(({ permission }) => permission)
  );

  // 去重
  return [...new Set(permissions)];
}
```

---

## 10. 版本歷史

| 版本 | 日期       | 說明                                  | 作者   |
| ---- | ---------- | ------------------------------------- | ------ |
| v1.0 | 2025-01-17 | 初版發布,完成使用者管理系統 SD 文件撰寫 | Claude |

---

**© 2025 Sys Public Property API. All rights reserved.**
