# 檔案上傳管理功能系統設計文件

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
| 檔案處理         | Multer                   | 1.4.x      | multipart/form-data    |
| 驗證套件         | class-validator          | 0.14.x     | DTO 參數驗證           |
| 轉換套件         | class-transformer        | 0.5.x      | 物件轉換               |
| API 文件         | @nestjs/swagger          | 7.x        | OpenAPI/Swagger 文件   |
| 雲端儲存         | @google-cloud/storage    | 7.x        | Google Cloud Storage   |
| 身份認證         | JWT                      | -          | Token 認證             |

### 1.2 模組架構

```
src/upload/
├── dto/
│   ├── create-upload.dto.ts              # 上傳 DTO
│   └── find-all-query.dto.ts             # 查詢 DTO
├── entities/
│   └── upload.entity.ts                  # Entity 實體
├── upload.controller.ts                  # Controller 層
├── upload.service.ts                     # Service 層
├── upload.module.ts                      # Module 定義
└── upload.interface.ts                   # 介面與 Enum 定義

src/third-party/file-storage/
├── file-storage.strategy.ts              # Strategy 介面定義
├── local-file-storage/
│   └── local-file-storage.strategy.ts    # 本地儲存策略
└── google-cloud-storage/
    └── google-cloud-storage.strategy.ts  # GCS 儲存策略
```

### 1.3 分層架構

```
┌─────────────────────────────────────┐
│         客戶端應用程式                │
└─────────────────────────────────────┘
              ↓ HTTP/HTTPS
              ↓ multipart/form-data
┌─────────────────────────────────────┐
│      Controller 層（路由處理）       │
│  - FileInterceptor (Multer)         │
│  - 參數驗證 (class-validator)       │
│  - Swagger 文件裝飾器               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Service 層（業務邏輯）         │
│  - 檔案名稱處理                     │
│  - 儲存策略選擇                     │
│  - 檔案元資料管理                   │
│  - 資料庫事務管理                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Strategy 層（儲存驅動抽象）      │
│  - IFileStorageStrategy             │
│  - LocalFileStorageStrategy         │
│  - GoogleCloudStorageStrategy       │
└─────────────────────────────────────┘
              ↓
┌───────────────┬─────────────────────┐
│ 本地檔案系統   │  Google Cloud Storage│
│  (開發/測試)   │    (正式環境)        │
└───────────────┴─────────────────────┘
              ↓ (元資料)
┌─────────────────────────────────────┐
│      Prisma ORM（資料存取）         │
│  - SQL 查詢建構                     │
│  - 型別安全的資料庫操作             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    PostgreSQL 資料庫（資料儲存）    │
│  - file_storage 資料表              │
└─────────────────────────────────────┘
```

### 1.4 Strategy Pattern 設計

**核心設計理念：**

檔案上傳模組使用 Strategy Pattern（策略模式）來抽象化不同的儲存驅動，實現以下目標：

1. **解耦儲存邏輯**：業務邏輯與具體儲存實作分離
2. **易於擴展**：新增儲存驅動無需修改現有代碼
3. **動態切換**：可在執行時期根據配置選擇儲存驅動
4. **混合儲存**：支援多種儲存驅動同時存在

**Strategy Pattern 架構圖：**

```
┌──────────────────────────────────────────────┐
│            UploadService (Context)            │
│  - strategyMap: Map<FileDriver, Strategy>    │
│  - driver: FileDriver (from config)           │
├──────────────────────────────────────────────┤
│  + create(file, dto)                          │
│  + download(uuid)                             │
│  - saveFile(driver, ...)                      │
└───────────────┬──────────────────────────────┘
                │
                ├─> 選擇策略
                │   strategy = strategyMap.get(driver)
                │
                ↓
┌───────────────────────────────────────────────┐
│   IFileStorageStrategy (Interface)            │
├───────────────────────────────────────────────┤
│  + save(directory, fileName, buffer, options) │
│  + download(directory, fileName)              │
│  + getPublicDownloadUrl(directory, fileName)  │
└────────┬─────────────────────┬────────────────┘
         │                     │
         ↓                     ↓
┌────────────────────┐ ┌──────────────────────────┐
│ LocalFileStorage   │ │ GoogleCloudStorage       │
│ Strategy           │ │ Strategy                 │
├────────────────────┤ ├──────────────────────────┤
│ - uploadPath       │ │ - bucket: Bucket         │
│ - baseUrl          │ │ - bucketName: string     │
├────────────────────┤ ├──────────────────────────┤
│ + save()           │ │ + save()                 │
│ + download()       │ │ + download()             │
│ + getPublicUrl()   │ │ + getPublicUrl()         │
└────────────────────┘ └──────────────────────────┘
         │                     │
         ↓                     ↓
┌────────────────────┐ ┌──────────────────────────┐
│  本地檔案系統       │ │  Google Cloud Storage    │
│  /uploads/...      │ │  gs://bucket-name/...    │
└────────────────────┘ └──────────────────────────┘
```

**優勢：**

- ✅ 開放封閉原則：對擴展開放，對修改封閉
- ✅ 單一職責原則：每個策略只負責一種儲存方式
- ✅ 依賴反轉原則：依賴抽象介面，而非具體實作
- ✅ 易於測試：可以輕鬆 Mock 不同的策略

---

## 2. API 文件規範

### 2.1 API 基本資訊

| 項目         | 說明                                   |
| ------------ | -------------------------------------- |
| **基礎 URL** | `/api/upload`                          |
| **協定**     | HTTP/HTTPS                             |
| **資料格式** | JSON / multipart/form-data             |
| **字元編碼** | UTF-8                                  |
| **認證方式** | JWT Token (Bearer)                     |

### 2.2 API 端點清單

| HTTP Method | 端點路徑                              | 功能說明             | 認證 |
| ----------- | ------------------------------------- | -------------------- | ---- |
| POST        | /api/upload                           | 上傳檔案             | ✅   |
| GET         | /api/upload/:uuid/action/download     | 下載檔案             | ✅   |
| GET         | /api/upload                           | 查詢上傳記錄列表     | ✅   |
| GET         | /api/upload/:uuid                     | 查詢單一上傳記錄     | ✅   |

---

### 2.3 API 端點詳細規格

#### 2.3.1 上傳檔案

**端點：** `POST /api/upload`

**說明：** 上傳檔案到系統，支援 multipart/form-data 格式。

**Content-Type：** `multipart/form-data`

**Request Headers：**

```typescript
{
  "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary...",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body：**

```typescript
interface CreateUploadDto {
  /** 檔案（必填） */
  file: File;

  /** 儲存路徑（可選） */
  path?: string;

  /** 指定檔案名稱（可選） */
  fileName?: string;
}
```

**Request 範例（使用 FormData）：**

```javascript
const formData = new FormData();
formData.append('file', fileBlob, '報表.pdf');
formData.append('path', 'documents');
formData.append('fileName', '2025年度報表.pdf');

// 發送請求
fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <JWT_TOKEN>'
  },
  body: formData
});
```

**欄位說明：**

| 欄位路徑   | 類型   | 必填 | 說明                                       |
| ---------- | ------ | ---- | ------------------------------------------ |
| `file`     | File   | ✅   | 要上傳的檔案（二進位資料）                 |
| `path`     | string | ❌   | 儲存路徑，未指定則自動分類                 |
| `fileName` | string | ❌   | 指定檔案顯示名稱，未指定則使用原始檔名     |

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "originFileName": "報表.pdf",
  "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "fileUrl": "https://example.com/files/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "updatedAt": "2025-11-17T00:00:00.000Z"
}
```

**Response 欄位說明：**

| 欄位路徑         | 類型   | 說明                                       |
| ---------------- | ------ | ------------------------------------------ |
| `uuid`           | string | 檔案唯一識別碼（UUID v4 格式）             |
| `originFileName` | string | 原始檔案名稱                               |
| `fileName`       | string | 儲存的檔案名稱（UUID + 副檔名）            |
| `fileType`       | string | MIME type（例：application/pdf）           |
| `fileSize`       | number | 檔案大小（bytes）                          |
| `fileUrl`        | string | 公開下載 URL                               |
| `createdAt`      | string | 建立時間（ISO 8601 格式）                  |
| `updatedAt`      | string | 更新時間（ISO 8601 格式）                  |

**失敗回應：**

**1. 未提供檔案 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "File is required",
  "error": "Bad Request"
}
```

**2. 檔案過大 (413 Payload Too Large)：**

```json
{
  "statusCode": 413,
  "message": "File size exceeds limit",
  "error": "Payload Too Large"
}
```

**3. 未授權 (401 Unauthorized)：**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**4. 儲存失敗 (500 Internal Server Error)：**

```json
{
  "statusCode": 500,
  "message": "Failed to save file",
  "error": "Internal Server Error"
}
```

---

#### 2.3.2 下載檔案

**端點：** `GET /api/upload/:uuid/action/download`

**說明：** 根據 UUID 下載檔案，回應為檔案的二進位資料流。

**Path Parameters：**

| 參數名稱 | 類型   | 必填 | 說明         |
| -------- | ------ | ---- | ------------ |
| `uuid`   | string | ✅   | 檔案 UUID    |

**Request 範例：**

```bash
GET /api/upload/550e8400-e29b-41d4-a716-446655440000/action/download
Authorization: Bearer <JWT_TOKEN>
```

**Response 回應：**

**成功回應 (200 OK)：**

**Headers：**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename*=utf-8''%E5%A0%B1%E8%A1%A8.pdf
Content-Length: 1024000
```

**Body：**

```
[Binary Data - 檔案內容]
```

**說明：**

- `Content-Type`：根據檔案的 `fileType` 設定
- `Content-Disposition`：設定為 `attachment` 觸發下載，`filename*` 使用 RFC 5987 格式支援 UTF-8 編碼
- `Content-Length`：檔案大小（自動設定）
- Body：檔案的二進位內容

**失敗回應：**

**1. UUID 格式錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "Invalid UUID format",
  "error": "Bad Request"
}
```

**2. 檔案不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此檔案(uuid: 550e8400-e29b-41d4-a716-446655440000)",
  "error": "Not Found"
}
```

**3. 儲存驅動異常 (500 Internal Server Error)：**

```json
{
  "statusCode": 500,
  "message": "Failed to read file from storage",
  "error": "Internal Server Error"
}
```

---

#### 2.3.3 查詢上傳記錄列表

**端點：** `GET /api/upload`

**說明：** 查詢檔案上傳記錄列表，支援分頁和篩選。

**Query Parameters：**

| 參數名稱   | 類型   | 必填 | 預設值  | 說明                                       |
| ---------- | ------ | ---- | ------- | ------------------------------------------ |
| `page`     | number | ❌   | 1       | 頁碼                                       |
| `limit`    | number | ❌   | 10      | 每頁筆數（最大 100）                       |
| `uuids`    | string | ❌   | -       | UUID 列表，逗號分隔（例：uuid1,uuid2）     |
| `startAt`  | string | ❌   | -       | 開始時間（ISO 8601 格式）                  |
| `endAt`    | string | ❌   | -       | 結束時間（ISO 8601 格式）                  |

**Request 範例：**

```bash
GET /api/upload?page=1&limit=20&startAt=2025-11-01T00:00:00.000Z&endAt=2025-11-17T23:59:59.999Z
Authorization: Bearer <JWT_TOKEN>
```

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "data": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "originFileName": "報表.pdf",
      "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "fileUrl": "https://example.com/files/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "updatedAt": "2025-11-17T00:00:00.000Z"
    },
    {
      "uuid": "660e9500-f39c-52e5-b827-557766551111",
      "originFileName": "產品圖片.jpg",
      "fileName": "b2c3d4e5-f6a7-8901-bcde-f12345678901.jpg",
      "fileType": "image/jpeg",
      "fileSize": 512000,
      "fileUrl": "https://example.com/images/b2c3d4e5-f6a7-8901-bcde-f12345678901.jpg",
      "createdAt": "2025-11-16T12:00:00.000Z",
      "updatedAt": "2025-11-16T12:00:00.000Z"
    }
  ],
  "meta": {
    "totalCount": 150
  }
}
```

**Response 欄位說明：**

| 欄位路徑         | 類型   | 說明                   |
| ---------------- | ------ | ---------------------- |
| `data`           | array  | 檔案記錄陣列           |
| `data[].uuid`    | string | 檔案 UUID              |
| `data[].originFileName` | string | 原始檔案名稱    |
| `data[].fileName` | string | 儲存檔案名稱          |
| `data[].fileType` | string | MIME type             |
| `data[].fileSize` | number | 檔案大小（bytes）     |
| `data[].fileUrl` | string | 公開下載 URL           |
| `data[].createdAt` | string | 建立時間            |
| `data[].updatedAt` | string | 更新時間            |
| `meta.totalCount` | number | 總筆數               |

**注意：**

- 目前查詢條件過濾（`uuids`, `startAt`, `endAt`）的實作尚未完成，但 DTO 已定義欄位
- 預設按 `createdAt` 降序排列
- `ResourceListEntity` 回應格式中的 `meta` 只包含 `totalCount`，不包含分頁資訊

---

#### 2.3.4 查詢單一上傳記錄

**端點：** `GET /api/upload/:uuid`

**說明：** 根據 UUID 查詢單一檔案的詳細資訊。

**Path Parameters：**

| 參數名稱 | 類型   | 必填 | 說明         |
| -------- | ------ | ---- | ------------ |
| `uuid`   | string | ✅   | 檔案 UUID    |

**Request 範例：**

```bash
GET /api/upload/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <JWT_TOKEN>
```

**Response 回應：**

**成功回應 (200 OK)：**

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "originFileName": "報表.pdf",
  "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "fileUrl": "https://example.com/files/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
  "createdAt": "2025-11-17T00:00:00.000Z",
  "updatedAt": "2025-11-17T00:00:00.000Z"
}
```

**失敗回應：**

**1. UUID 格式錯誤 (400 Bad Request)：**

```json
{
  "statusCode": 400,
  "message": "Invalid UUID format",
  "error": "Bad Request"
}
```

**2. 檔案不存在 (404 Not Found)：**

```json
{
  "statusCode": 404,
  "message": "無此檔案(uuid: 550e8400-e29b-41d4-a716-446655440000)",
  "error": "Not Found"
}
```

---

### 2.4 HTTP 狀態碼對照表

| 狀態碼 | 說明                 | 使用情境                             |
| ------ | -------------------- | ------------------------------------ |
| 200    | OK                   | 上傳、查詢、下載成功                 |
| 400    | Bad Request          | 參數驗證失敗、未提供檔案             |
| 401    | Unauthorized         | 未提供認證 Token 或 Token 無效       |
| 403    | Forbidden            | 沒有執行此操作的權限                 |
| 404    | Not Found            | 檔案不存在                           |
| 413    | Payload Too Large    | 檔案大小超過限制                     |
| 500    | Internal Server Error| 伺服器內部錯誤、儲存失敗             |

---

## 3. 資料結構定義

### 3.1 資料庫 Schema

**Prisma Schema 定義：**

```prisma
model FileStorage {
  uuid      String    @id @default(uuid()) @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)

  /// 路徑
  path String

  /// 驅動
  driver String

  /// 原始檔案名稱
  originFileName String @map("origin_file_name")

  /// 檔案名稱 (UUID)
  fileName String @map("file_name")

  /// 檔案路徑
  filePath String @map("file_path")

  /// 檔案類型
  fileType String @map("file_type")

  /// 檔案大小
  fileSize Int @map("file_size")

  /// 檔案 URL
  fileUrl String @map("file_url")

  @@map("file_storage")
}
```

**資料表結構：**

| 欄位名稱          | 資料類型             | 限制條件           | 說明                         |
| ----------------- | -------------------- | ------------------ | ---------------------------- |
| `uuid`            | UUID                 | PRIMARY KEY        | 主鍵 UUID                    |
| `created_at`      | TIMESTAMPTZ(3)       | NOT NULL, DEFAULT  | 建立時間                     |
| `updated_at`      | TIMESTAMPTZ(3)       | NOT NULL           | 更新時間                     |
| `deleted_at`      | TIMESTAMPTZ(3)       | NULL               | 軟刪除時間                   |
| `path`            | VARCHAR              | NOT NULL           | 儲存路徑（目錄）             |
| `driver`          | VARCHAR              | NOT NULL           | 儲存驅動                     |
| `origin_file_name`| VARCHAR              | NOT NULL           | 原始檔案名稱                 |
| `file_name`       | VARCHAR              | NOT NULL           | 儲存檔案名稱（UUID）         |
| `file_path`       | VARCHAR              | NOT NULL           | 完整檔案路徑                 |
| `file_type`       | VARCHAR              | NOT NULL           | MIME type                    |
| `file_size`       | INTEGER              | NOT NULL           | 檔案大小（bytes）            |
| `file_url`        | VARCHAR              | NOT NULL           | 公開下載 URL                 |

**索引建議：**

```sql
-- UUID 主鍵索引（自動建立）
-- PRIMARY KEY (uuid)

-- 建立時間索引（用於排序和時間範圍查詢）
CREATE INDEX idx_file_storage_created_at
ON file_storage(created_at DESC);

-- 軟刪除過濾索引
CREATE INDEX idx_file_storage_deleted_at
ON file_storage(deleted_at)
WHERE deleted_at IS NULL;

-- 驅動類型索引（用於統計和管理）
CREATE INDEX idx_file_storage_driver
ON file_storage(driver);

-- 檔案類型索引（用於分類統計）
CREATE INDEX idx_file_storage_file_type
ON file_storage(file_type);
```

---

### 3.2 Entity 定義

**UploadEntity：**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { FileStorage } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UploadEntity implements FileStorage {
  /** 主鍵 UUID */
  @ApiProperty({ format: 'uuid' })
  @Expose()
  uuid!: string;

  /** 建立時間 */
  @ApiProperty()
  @Expose()
  createdAt!: Date;

  /** 更新時間 */
  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  /** 原始檔案名稱 */
  @ApiProperty({ description: '原始檔案名稱', example: 'IMG_0876' })
  @Expose()
  originFileName!: string;

  /** 檔案名稱（UUID + 副檔名） */
  @ApiProperty({ description: '檔案名稱', example: 'IMG_0876' })
  @Expose()
  fileName!: string;

  /** 檔案類型（MIME type） */
  @ApiProperty({ description: '檔案類型', example: 'image/png' })
  @Expose()
  fileType!: string;

  /** 檔案大小（bytes） */
  @ApiProperty({ description: '檔案大小(bytes)', example: 1000 })
  @Expose()
  fileSize!: number;

  /** 檔案 URL */
  @ApiProperty({ description: '檔案 URL' })
  @Expose()
  fileUrl!: string;

  /** 路徑（內部欄位，不暴露於 API） */
  path!: string;

  /** 驅動（內部欄位，不暴露於 API） */
  driver!: string;

  /** 檔案路徑（內部欄位，不暴露於 API） */
  filePath!: string;

  /** 軟刪除時間（內部欄位，不暴露於 API） */
  deletedAt!: Date | null;
}
```

**欄位說明：**

- 使用 `@Exclude()` 裝飾器預設排除所有欄位
- 使用 `@Expose()` 裝飾器明確指定要暴露的欄位
- 內部欄位（`path`, `driver`, `filePath`, `deletedAt`）不使用 `@Expose()`
- 所有公開欄位都使用 `@ApiProperty` 提供 Swagger 文件

---

### 3.3 DTO 定義

#### 3.3.1 CreateUploadDto

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateUploadDto {
  /** 檔案 */
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  /** 路徑（可選） */
  @ApiPropertyOptional({ description: '路徑' })
  @IsOptional()
  @IsString()
  path?: string;

  /** 指定檔案名稱（可選） */
  @ApiPropertyOptional({ description: '指定檔案名稱' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
```

**驗證規則：**

| 欄位       | 驗證器           | 說明                 |
| ---------- | ---------------- | -------------------- |
| `file`     | ParseFilePipe    | 檔案必填驗證         |
| `path`     | `@IsString()`    | 必須為字串（可選）   |
| `path`     | `@IsOptional()`  | 可選欄位             |
| `fileName` | `@IsString()`    | 必須為字串（可選）   |
| `fileName` | `@IsOptional()`  | 可選欄位             |

**說明：**

- `file` 欄位在 Swagger 中顯示為檔案上傳控制項
- 實際驗證由 `ParseFilePipe` 在 Controller 層處理
- `path` 和 `fileName` 為可選欄位，未提供則使用預設值

---

#### 3.3.2 FindAllQueryDto

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';

export class FindAllQueryDto extends PaginationQueryDto {
  /** UUID 列表 */
  @ApiPropertyOptional({
    type: String,
    description: 'uuid，以","分隔的字串',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')), {
    toClassOnly: true,
  })
  uuids?: string[];

  /** 開始時間 */
  @ApiPropertyOptional({ description: '開始時間' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startAt?: Date;

  /** 結束時間 */
  @ApiPropertyOptional({ description: '結束時間' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endAt?: Date;
}
```

**繼承的欄位（來自 PaginationQueryDto）：**

| 欄位    | 類型   | 必填 | 預設值 | 說明         |
| ------- | ------ | ---- | ------ | ------------ |
| `page`  | number | ❌   | 1      | 頁碼         |
| `limit` | number | ❌   | 10     | 每頁筆數     |

**自訂欄位：**

| 欄位      | 類型     | 必填 | 說明                       |
| --------- | -------- | ---- | -------------------------- |
| `uuids`   | string[] | ❌   | UUID 列表（自動分割）      |
| `startAt` | Date     | ❌   | 開始時間（自動轉換）       |
| `endAt`   | Date     | ❌   | 結束時間（自動轉換）       |

**特殊處理：**

- `uuids`：使用 `@Transform` 將逗號分隔字串自動轉換為陣列
- `startAt`, `endAt`：使用 `@Type(() => Date)` 自動轉換為 Date 物件

**注意：**

- 查詢條件過濾（`uuids`, `startAt`, `endAt`）的實作尚未完成
- DTO 已定義欄位，但 Service 層尚未使用這些條件進行查詢

---

### 3.4 Enum 定義

**FileDriver Enum：**

```typescript
export enum FileDriver {
  /** 本地檔案系統 */
  LOCAL = 'local',

  /** Google Cloud Storage */
  GOOGLE_CLOUD_STORAGE = 'google-cloud-storage',
}
```

**說明：**

- 定義支援的儲存驅動類型
- 可擴展新的驅動類型（如 AWS S3、Azure Blob Storage）

---

### 3.5 Interface 定義

**IFileStorageStrategy：**

```typescript
export interface IFileStorageStrategy {
  /**
   * 儲存檔案
   * @param directory 目錄
   * @param fileName 檔案名稱
   * @param buffer 檔案內容
   * @param options 選項
   */
  save(
    directory: string,
    fileName: string,
    buffer: Buffer,
    options?: {
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<void>;

  /**
   * 取得公開下載 URL
   * @param directory 目錄
   * @param fileName 檔案名稱
   */
  getPublicDownloadUrl(directory: string, fileName: string): string;
}
```

**IFileStorageDownloadStrategy：**

```typescript
export interface IFileStorageDownloadStrategy {
  /**
   * 下載檔案
   * @param directory 目錄
   * @param fileName 檔案名稱
   */
  download(directory: string, fileName: string): Promise<Buffer>;
}
```

**說明：**

- 所有儲存策略必須實作這些介面
- `save` 方法負責檔案儲存
- `download` 方法負責檔案讀取
- `getPublicDownloadUrl` 方法提供公開下載 URL

---

### 3.6 資料關聯圖

```
FileStorage (檔案儲存)
  │
  ├─ uuid: String (主鍵)
  ├─ path: String (目錄)
  ├─ driver: String (驅動)
  ├─ originFileName: String (原始檔名)
  ├─ fileName: String (UUID 檔名)
  ├─ filePath: String (完整路徑)
  ├─ fileType: String (MIME type)
  ├─ fileSize: Int (大小)
  └─ fileUrl: String (下載 URL)
```

**未來可能的關聯：**

```
FileStorage
  │
  ├─> Property (資產) - 資產照片
  ├─> Demand (需求) - 需求附件
  ├─> User (使用者) - 使用者頭像
  └─> ... 其他業務模組
```

---

## 4. 業務邏輯設計

### 4.1 Service 層設計

**UploadService 類別結構：**

```typescript
@Injectable()
export class UploadService {
  // **********
  // 私有屬性
  // **********

  /** 儲存策略 Map */
  private readonly strategyMap: Map<
    FileDriver,
    IFileStorageStrategy & IFileStorageDownloadStrategy
  >;

  /** 當前配置的驅動 */
  private readonly driver: FileDriver;

  // **********
  // 依賴注入
  // **********

  constructor(
    private readonly prismaService: PrismaService,
    private readonly moduleRef: ModuleRef,
    private readonly configService: ConfigService,
  ) {
    // 初始化 strategyMap
    this.driver = this.configService.getOrThrow<string>(
      'thirdParty.fileSystemDriver',
    ) as FileDriver;

    this.strategyMap = new Map()
      .set(FileDriver.LOCAL, this.moduleRef.get(LocalFileStorageStrategy))
      .set(FileDriver.GOOGLE_CLOUD_STORAGE, this.moduleRef.get(GoogleCloudStorageStrategy));
  }

  // **********
  // 公開方法
  // **********

  /** 上傳檔案 */
  async create(file: Express.Multer.File, dto: CreateUploadDto): Promise<UploadEntity>

  /** 下載檔案 */
  async download(uuid: string): Promise<{ upload: FileStorage; buffer: Buffer }>

  /** 查詢列表 */
  async findAll(query: FindAllQueryDto): Promise<[UploadEntity[], number]>

  /** 查詢單一記錄 */
  async findOne(uuid: string): Promise<UploadEntity>

  // **********
  // 內部方法
  // **********

  /** 儲存檔案到儲存系統 */
  private async saveFile(
    driver: FileDriver,
    directory: string,
    fileName: string,
    mimetype: string,
    buffer: Buffer,
    originFileName: string,
  ): Promise<string>

  /** 取得預設儲存目錄 */
  private getDefaultFolder(filename: string): string

  /** 查詢或拋出 404 錯誤 */
  private async findOrThrow(uuid: string): Promise<FileStorage>
}
```

---

### 4.2 核心業務邏輯

#### 4.2.1 上傳檔案邏輯

```typescript
async create(file: Express.Multer.File, dto: CreateUploadDto) {
  // 1. 解構檔案資訊
  const { path } = dto;
  const { originalname, mimetype, buffer, size } = file;

  // 2. 處理檔案名稱
  const originFileName = formatFileName(dto.fileName ?? originalname);
  const fileName = `${randomUUID()}${extname(originFileName)}`;
  const directory = path ?? this.getDefaultFolder(originFileName);

  // 3. 儲存檔案到儲存系統
  const filePath = await this.saveFile(
    this.driver,
    directory,
    fileName,
    mimetype,
    buffer,
    originFileName,
  );

  // 4. 建構資料庫 CreateInput
  const data: Prisma.FileStorageCreateInput = {
    path: directory,
    driver: this.driver,
    originFileName,
    fileName,
    filePath,
    fileType: mimetype,
    fileSize: size,
    fileUrl: this.strategyMap
      .get(this.driver)!
      .getPublicDownloadUrl(directory, fileName),
  };

  // 5. 使用事務建立資料庫記錄
  const orm = await this.prismaService
    .$transaction(async (tx) => {
      return await tx.fileStorage.create({ data });
    })
    .catch(catchPrismaErrorOrThrow(entityName));

  // 6. 轉換為 Entity 並返回
  return plainToInstance(UploadEntity, orm);
}
```

**流程說明：**

1. **解構檔案資訊**：從 Multer 檔案物件取得必要資訊
2. **處理檔案名稱**：
   - `originFileName`：使用 `formatFileName()` 格式化原始檔名
   - `fileName`：生成 UUID + 副檔名
   - `directory`：使用者指定或自動分類
3. **儲存檔案**：呼叫 `saveFile()` 方法，使用 Strategy Pattern
4. **建構 CreateInput**：準備所有欄位資料
5. **事務建立記錄**：確保資料一致性
6. **轉換並返回**：使用 `plainToInstance` 轉換為 Entity

---

#### 4.2.2 檔案儲存邏輯（Strategy Pattern）

```typescript
async saveFile(
  driver: FileDriver,
  directory: string,
  fileName: string,
  mimetype: string,
  buffer: Buffer,
  originFileName: string,
): Promise<string> {
  // 1. 根據驅動取得策略
  const strategy = this.strategyMap.get(driver);
  if (!strategy) {
    throw new Error(`Unsupported file driver: ${driver}`);
  }

  // 2. 執行儲存操作
  await strategy.save(directory, fileName, buffer, {
    contentDisposition: `attachment; filename*=utf-8''${encodeURI(originFileName)}`,
    contentType: mimetype,
  });

  // 3. 返回檔案路徑
  return `${directory}/${fileName}`;
}
```

**Strategy Pattern 優勢：**

- 業務邏輯不需要知道具體儲存實作
- 切換儲存驅動只需修改配置
- 易於新增新的儲存驅動
- 每個策略獨立測試

---

#### 4.2.3 下載檔案邏輯

```typescript
async download(uuid: string) {
  // 1. 查詢檔案記錄
  const orm = await this.findOrThrow(uuid);

  // 2. 根據記錄中的驅動取得策略
  const strategy = this.strategyMap.get(orm.driver as FileDriver);
  if (!strategy) {
    throw new Error(`Unsupported file driver for download: ${orm.driver}`);
  }

  // 3. 執行下載操作
  const buffer = await strategy.download(orm.path, orm.fileName);

  // 4. 返回檔案記錄和內容
  return { upload: orm, buffer };
}
```

**重要設計：**

- 使用檔案記錄中的 `driver` 欄位選擇策略
- 支援混合儲存（不同檔案可能使用不同驅動）
- 下載時自動選擇正確的策略

---

#### 4.2.4 自動目錄分類邏輯

```typescript
private getDefaultFolder(filename: string): string {
  if (!filename) {
    return 'public';
  }

  // 提取副檔名（小寫）
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // 根據副檔名分類
  switch (ext) {
    // 文件類型
    case 'xls':
    case 'xlsx':
    case 'doc':
    case 'docx':
    case 'ppt':
    case 'pptx':
    case 'pdf':
    case 'txt':
    case 'csv':
    case 'zip':
    case '7z':
    case 'gzip':
    case 'iso':
    case 'rar':
    case 'tar':
      return 'files';

    // 圖片類型
    case 'bmp':
    case 'gif':
    case 'jpeg':
    case 'jpg':
    case 'png':
    case 'ico':
    case 'tif':
    case 'tiff':
      return 'images';

    // 影音類型
    case 'mp3':
    case 'avi':
    case 'mp4':
    case 'wav':
    case 'flv':
    case 'mpg':
    case 'mpeg':
    case 'mov':
    case 'rmvb':
    case 'wmv':
    case 'swf':
      return 'video';

    // 其他類型
    default:
      return 'other';
  }
}
```

**分類規則：**

- 根據副檔名自動判斷目錄
- 不區分大小寫
- 未知類型歸類到 `other`
- 無副檔名歸類到 `public`

---

#### 4.2.5 查詢列表邏輯

```typescript
async findAll(query: FindAllQueryDto): Promise<[UploadEntity[], number]> {
  const { page, limit } = query;

  // 執行分頁查詢
  const { result, ...meta } = await this.prismaService.fileStorage.pagination({
    page,
    limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 轉換並返回
  return [plainToInstance(UploadEntity, result), meta.totalCount];
}
```

**注意：**

- 目前查詢條件（`uuids`, `startAt`, `endAt`）尚未實作
- 預設按 `createdAt` 降序排列
- 使用 Prisma 的 `pagination` 方法自動處理分頁

**建議實作完整查詢條件：**

```typescript
async findAll(query: FindAllQueryDto): Promise<[UploadEntity[], number]> {
  const { page, limit, uuids, startAt, endAt } = query;

  // 建構 WHERE 條件
  const where: Prisma.FileStorageWhereInput = {};

  // UUID 篩選
  if (uuids && uuids.length > 0) {
    where.uuid = { in: uuids };
  }

  // 時間範圍篩選
  if (startAt || endAt) {
    where.createdAt = {};
    if (startAt) where.createdAt.gte = startAt;
    if (endAt) where.createdAt.lte = endAt;
  }

  // 執行查詢
  const { result, ...meta } = await this.prismaService.fileStorage.pagination({
    page,
    limit,
    where,
    orderBy: { createdAt: 'desc' },
  });

  return [plainToInstance(UploadEntity, result), meta.totalCount];
}
```

---

#### 4.2.6 findOrThrow 支援方法

```typescript
async findOrThrow(uuid: string) {
  const orm = await this.prismaService.fileStorage.findFirst({
    where: { uuid },
  });

  if (!orm) {
    const response = `無此${entityName}(uuid: ${uuid})`;
    throw new HttpException(response, HttpStatus.NOT_FOUND);
  }

  return orm;
}
```

**用途：**

- 統一的檔案存在性驗證
- 提供一致的錯誤訊息格式
- 簡化 Service 層代碼

---

### 4.3 Strategy 實作範例

#### 4.3.1 LocalFileStorageStrategy

```typescript
@Injectable()
export class LocalFileStorageStrategy
  implements IFileStorageStrategy, IFileStorageDownloadStrategy
{
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get('thirdParty.local.uploadPath', './uploads');
    this.baseUrl = this.configService.get('thirdParty.local.baseUrl', 'http://localhost:3000');
  }

  async save(
    directory: string,
    fileName: string,
    buffer: Buffer,
    options?: { contentDisposition?: string; contentType?: string },
  ): Promise<void> {
    const dirPath = path.join(this.uploadPath, directory);
    const filePath = path.join(dirPath, fileName);

    // 確保目錄存在
    await fs.promises.mkdir(dirPath, { recursive: true });

    // 寫入檔案
    await fs.promises.writeFile(filePath, buffer);
  }

  async download(directory: string, fileName: string): Promise<Buffer> {
    const filePath = path.join(this.uploadPath, directory, fileName);

    // 讀取檔案
    return await fs.promises.readFile(filePath);
  }

  getPublicDownloadUrl(directory: string, fileName: string): string {
    return `${this.baseUrl}/${directory}/${fileName}`;
  }
}
```

---

#### 4.3.2 GoogleCloudStorageStrategy

```typescript
@Injectable()
export class GoogleCloudStorageStrategy
  implements IFileStorageStrategy, IFileStorageDownloadStrategy
{
  private readonly bucket: Bucket;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const storage = new Storage({
      projectId: this.configService.get('thirdParty.gcs.projectId'),
      keyFilename: this.configService.get('thirdParty.gcs.keyFilename'),
    });

    this.bucketName = this.configService.get('thirdParty.gcs.bucketName');
    this.bucket = storage.bucket(this.bucketName);
  }

  async save(
    directory: string,
    fileName: string,
    buffer: Buffer,
    options?: { contentDisposition?: string; contentType?: string },
  ): Promise<void> {
    const filePath = `${directory}/${fileName}`;
    const file = this.bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: options?.contentType,
        contentDisposition: options?.contentDisposition,
      },
    });
  }

  async download(directory: string, fileName: string): Promise<Buffer> {
    const filePath = `${directory}/${fileName}`;
    const file = this.bucket.file(filePath);

    const [buffer] = await file.download();
    return buffer;
  }

  getPublicDownloadUrl(directory: string, fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${directory}/${fileName}`;
  }
}
```

---

## 5. 錯誤處理機制

### 5.1 錯誤處理流程

```
錯誤發生
  │
  ├─> Multer 錯誤（檔案上傳）
  │   └─> NestJS ExceptionFilter
  │       ├─> 檔案過大 → 413 Payload Too Large
  │       └─> 其他錯誤 → 400 Bad Request
  │
  ├─> 驗證錯誤 (class-validator)
  │   └─> NestJS ValidationPipe
  │       ├─> 收集所有驗證錯誤
  │       └─> 返回 400 Bad Request
  │
  ├─> Prisma 錯誤
  │   └─> catchPrismaErrorOrThrow(entityName)
  │       ├─> 解析 Prisma 錯誤代碼
  │       └─> 轉換為 HttpException
  │
  ├─> 業務邏輯錯誤
  │   └─> HttpException
  │       ├─> 檔案不存在 → 404 Not Found
  │       ├─> 不支援的驅動 → 500 Internal Server Error
  │       └─> 儲存失敗 → 500 Internal Server Error
  │
  └─> 其他錯誤
      └─> NestJS ExceptionFilter
          └─> 返回 500 Internal Server Error
```

### 5.2 常見錯誤處理

**1. 檔案未提供錯誤：**

```typescript
// Controller 層
@Post()
async upload(
  @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
  file: Express.Multer.File,
  @Body() dto: CreateUploadDto,
) {
  return this.uploadService.create(file, dto);
}
```

**2. 檔案不存在錯誤：**

```typescript
async findOrThrow(uuid: string) {
  const orm = await this.prismaService.fileStorage.findFirst({
    where: { uuid },
  });

  if (!orm) {
    throw new HttpException(
      `無此檔案(uuid: ${uuid})`,
      HttpStatus.NOT_FOUND,
    );
  }

  return orm;
}
```

**3. 不支援的驅動錯誤：**

```typescript
async saveFile(...) {
  const strategy = this.strategyMap.get(driver);
  if (!strategy) {
    throw new Error(`Unsupported file driver: ${driver}`);
  }
  // ...
}
```

**4. Prisma 錯誤處理：**

```typescript
const orm = await this.prismaService
  .$transaction(async (tx) => {
    return await tx.fileStorage.create({ data });
  })
  .catch(catchPrismaErrorOrThrow(entityName));
```

---

### 5.3 錯誤回應格式統一

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
  "message": "無此檔案(uuid: 550e8400-e29b-41d4-a716-446655440000)",
  "error": "Not Found"
}
```

---

## 6. 安全性設計

### 6.1 檔案上傳安全

**1. 檔案大小限制：**

```typescript
// 在 NestJS main.ts 中設定
app.useBodyParser('json', { limit: '10mb' });
app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
```

**2. MIME type 驗證（建議實作）：**

```typescript
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  // ...
];

if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new HttpException(
    '不支援的檔案類型',
    HttpStatus.BAD_REQUEST,
  );
}
```

**3. 檔名安全處理：**

```typescript
// 使用 UUID 檔名避免路徑遍歷攻擊
const fileName = `${randomUUID()}${extname(originFileName)}`;

// 格式化原始檔名
const originFileName = formatFileName(dto.fileName ?? originalname);
```

---

### 6.2 檔案下載安全

**1. UUID 驗證：**

```typescript
// 自動驗證 UUID 格式
@Get(':uuid/action/download')
async downloadFile(@Param('uuid') uuid: string, @Res() res: Response) {
  // ...
}
```

**2. 檔案存在性驗證：**

```typescript
const orm = await this.findOrThrow(uuid);
```

**3. Content-Type 設定：**

```typescript
res.set({
  'Content-Type': upload.fileType,
  'Content-Disposition': `attachment; filename*=utf-8''${downloadName}`,
});
```

**4. 權限控制（建議實作）：**

```typescript
// 檢查使用者是否有權存取此檔案
if (!await this.checkFileAccess(user.id, uuid)) {
  throw new HttpException('無權存取此檔案', HttpStatus.FORBIDDEN);
}
```

---

### 6.3 儲存系統安全

**1. 本地儲存：**

- 限制上傳目錄權限
- 定期掃描惡意檔案
- 設定目錄配額

**2. 雲端儲存：**

- 使用 IAM 權限控制
- 啟用加密儲存
- 設定存取日誌

**3. 檔案掃描（建議整合）：**

```typescript
// 整合防毒軟體 API
const scanResult = await antivirusService.scan(buffer);
if (scanResult.infected) {
  throw new HttpException('檔案包含惡意內容', HttpStatus.BAD_REQUEST);
}
```

---

### 6.4 身份認證與授權

**JWT Token 認證：**

```typescript
@ApiTags('檔案管理')
@Controller('upload')
@UseGuards(JwtAuthGuard) // 全部 API 需要認證
export class UploadController {
  // ...
}
```

**權限控制（建議實作）：**

```typescript
@Post()
@Roles('admin', 'user') // 指定允許的角色
async upload(...) {
  // ...
}
```

---

## 7. 效能考量

### 7.1 檔案上傳效能優化

**1. 串流上傳（大檔案）：**

```typescript
// 建議實作分塊上傳
@Post('chunked')
async uploadChunked(
  @Body() dto: ChunkedUploadDto,
  @UploadedFile() chunk: Express.Multer.File,
) {
  // 處理分塊上傳邏輯
}
```

**2. 並發限制：**

```typescript
// 使用 Rate Limiting 限制並發上傳
@Throttle(10, 60) // 每分鐘最多 10 次
@Post()
async upload(...) {
  // ...
}
```

**3. 檔案壓縮（圖片）：**

```typescript
// 上傳圖片時自動壓縮
if (file.mimetype.startsWith('image/')) {
  buffer = await this.imageService.compress(buffer);
}
```

---

### 7.2 檔案下載效能優化

**1. 串流下載：**

```typescript
// 目前實作使用 Buffer，建議改為串流
@Get(':uuid/action/download')
async downloadFile(@Param('uuid') uuid: string, @Res() res: Response) {
  const orm = await this.uploadService.findOrThrow(uuid);
  const strategy = this.strategyMap.get(orm.driver);

  // 建議改為串流
  const stream = await strategy.downloadStream(orm.path, orm.fileName);
  stream.pipe(res);
}
```

**2. CDN 整合：**

```typescript
// 使用 CDN 加速下載
getPublicDownloadUrl(directory: string, fileName: string): string {
  return `https://cdn.example.com/${directory}/${fileName}`;
}
```

**3. 快取策略：**

```typescript
// 設定快取 Headers
res.set({
  'Cache-Control': 'public, max-age=31536000', // 1 年
  'ETag': fileHash,
});
```

---

### 7.3 資料庫效能優化

**1. 索引優化：**

```sql
-- 建立必要索引
CREATE INDEX idx_file_storage_created_at ON file_storage(created_at DESC);
CREATE INDEX idx_file_storage_driver ON file_storage(driver);
```

**2. 查詢優化：**

```typescript
// 只查詢必要欄位
const { result } = await this.prismaService.fileStorage.pagination({
  select: {
    uuid: true,
    originFileName: true,
    fileSize: true,
    createdAt: true,
  },
  // ...
});
```

**3. 分頁限制：**

```typescript
// 限制單次查詢筆數
const maxLimit = 100;
const limit = Math.min(query.limit || 10, maxLimit);
```

---

### 7.4 儲存空間優化

**1. 定期清理：**

```typescript
// 定期清理軟刪除檔案
@Cron('0 0 * * *') // 每天執行
async cleanupDeletedFiles() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 查詢軟刪除超過 30 天的檔案
  const files = await this.prismaService.fileStorage.findMany({
    where: {
      deletedAt: { lte: thirtyDaysAgo },
    },
  });

  // 刪除檔案實體和資料庫記錄
  for (const file of files) {
    await this.deleteFilePhysically(file);
    await this.prismaService.fileStorage.delete({ where: { uuid: file.uuid } });
  }
}
```

**2. 重複檔案檢測：**

```typescript
// 使用檔案 Hash 檢測重複
const fileHash = await this.calculateHash(buffer);
const existing = await this.prismaService.fileStorage.findFirst({
  where: { fileHash },
});

if (existing) {
  // 返回既有檔案記錄，不重複上傳
  return existing;
}
```

---

## 8. 範例代碼

### 8.1 前端整合範例（TypeScript + Fetch）

**上傳檔案：**

```typescript
interface UploadResponse {
  uuid: string;
  originFileName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}

async function uploadFile(
  token: string,
  file: File,
  options?: {
    path?: string;
    fileName?: string;
  },
): Promise<UploadResponse> {
  // 建立 FormData
  const formData = new FormData();
  formData.append('file', file);

  if (options?.path) {
    formData.append('path', options.path);
  }

  if (options?.fileName) {
    formData.append('fileName', options.fileName);
  }

  // 發送請求
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// 使用範例
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files[0];

try {
  const result = await uploadFile(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    file,
    {
      path: 'documents',
      fileName: '2025年度報表.pdf',
    },
  );

  console.log('上傳成功:', result);
  console.log('檔案 URL:', result.fileUrl);
} catch (error) {
  console.error('上傳失敗:', error);
}
```

---

**帶進度條的上傳：**

```typescript
async function uploadFileWithProgress(
  token: string,
  file: File,
  onProgress: (percent: number) => void,
  options?: {
    path?: string;
    fileName?: string;
  },
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.path) {
      formData.append('path', options.path);
    }

    if (options?.fileName) {
      formData.append('fileName', options.fileName);
    }

    const xhr = new XMLHttpRequest();

    // 監聽進度
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(Math.round(percent));
      }
    });

    // 監聽完成
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.statusText));
      }
    });

    // 監聽錯誤
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    // 發送請求
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// 使用範例
await uploadFileWithProgress(
  token,
  file,
  (percent) => {
    console.log(`上傳進度: ${percent}%`);
    // 更新進度條 UI
  },
  { path: 'documents' },
);
```

---

**下載檔案：**

```typescript
async function downloadFile(
  token: string,
  uuid: string,
  originalFileName?: string,
): Promise<void> {
  const response = await fetch(`/api/upload/${uuid}/action/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('下載失敗');
  }

  // 取得檔案 Blob
  const blob = await response.blob();

  // 從 Content-Disposition 取得檔名（如果沒有提供）
  const disposition = response.headers.get('Content-Disposition');
  let filename = originalFileName || 'download';

  if (disposition) {
    const matches = /filename\*=utf-8''(.+)/.exec(disposition);
    if (matches && matches[1]) {
      filename = decodeURIComponent(matches[1]);
    }
  }

  // 觸發下載
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// 使用範例
await downloadFile(
  token,
  '550e8400-e29b-41d4-a716-446655440000',
  '報表.pdf',
);
```

---

**查詢列表：**

```typescript
interface FindAllQuery {
  page?: number;
  limit?: number;
  uuids?: string[];
  startAt?: Date;
  endAt?: Date;
}

interface ResourceListResponse {
  data: UploadResponse[];
  meta: {
    totalCount: number;
  };
}

async function getUploadList(
  token: string,
  query: FindAllQuery = {},
): Promise<ResourceListResponse> {
  const params = new URLSearchParams();

  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.uuids) params.append('uuids', query.uuids.join(','));
  if (query.startAt) params.append('startAt', query.startAt.toISOString());
  if (query.endAt) params.append('endAt', query.endAt.toISOString());

  const response = await fetch(
    `/api/upload?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('查詢失敗');
  }

  return await response.json();
}

// 使用範例
const result = await getUploadList(token, {
  page: 1,
  limit: 20,
  startAt: new Date('2025-11-01'),
  endAt: new Date('2025-11-17'),
});

console.log(`共 ${result.meta.totalCount} 筆檔案`);
result.data.forEach((file) => {
  console.log(`- ${file.originFileName} (${file.fileSize} bytes)`);
});
```

---

### 8.2 React 整合範例

**上傳元件：**

```tsx
import React, { useState } from 'react';

interface UploadProps {
  token: string;
  onSuccess?: (result: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export const FileUploader: React.FC<UploadProps> = ({
  token,
  onSuccess,
  onError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFileWithProgress(
        token,
        file,
        (percent) => setProgress(percent),
      );

      onSuccess?.(result);
      setFile(null);
      setProgress(0);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {file && (
        <div>
          <p>已選擇: {file.name}</p>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? '上傳中...' : '上傳'}
          </button>
        </div>
      )}

      {uploading && (
        <div>
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};
```

---

### 8.3 測試範例

**單元測試（Service 層）：**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';

describe('UploadService', () => {
  let service: UploadService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: PrismaService,
          useValue: {
            fileStorage: {
              create: jest.fn(),
              findFirst: jest.fn(),
              pagination: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('local'),
          },
        },
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('應該成功上傳檔案', async () => {
      const file = {
        originalname: '測試檔案.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        size: 1000,
      } as Express.Multer.File;

      const dto = { path: 'files' };

      const mockResult = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        originFileName: '測試檔案.pdf',
        fileName: 'a1b2c3d4.pdf',
        fileType: 'application/pdf',
        fileSize: 1000,
        fileUrl: 'http://localhost:3000/files/a1b2c3d4.pdf',
        path: 'files',
        driver: 'local',
        filePath: 'files/a1b2c3d4.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prisma.fileStorage, 'create').mockResolvedValue(mockResult);
      jest.spyOn(service as any, 'saveFile').mockResolvedValue('files/a1b2c3d4.pdf');

      const result = await service.create(file, dto);

      expect(result).toHaveProperty('uuid');
      expect(result).toHaveProperty('originFileName', '測試檔案.pdf');
    });
  });

  describe('download', () => {
    it('應該返回檔案內容', async () => {
      const mockFile = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        path: 'files',
        driver: 'local',
        fileName: 'a1b2c3d4.pdf',
        // ...
      };

      jest.spyOn(service as any, 'findOrThrow').mockResolvedValue(mockFile);

      const mockBuffer = Buffer.from('test content');
      const mockStrategy = {
        download: jest.fn().mockResolvedValue(mockBuffer),
      };

      (service as any).strategyMap = new Map([['local', mockStrategy]]);

      const result = await service.download('550e8400-e29b-41d4-a716-446655440000');

      expect(result.buffer).toEqual(mockBuffer);
      expect(result.upload).toEqual(mockFile);
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
