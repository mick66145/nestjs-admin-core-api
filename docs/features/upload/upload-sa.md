# 檔案上傳管理功能系統分析文件

> **版本：** v1.0
> **更新日期：** 2025-11-17
> **文件類型：** 系統分析與流程設計文件

---

## 📋 目錄

- [1. 概述](#1-概述)
- [2. 功能概述](#2-功能概述)
- [3. 使用情境範例](#3-使用情境範例)
- [4. 系統流程圖](#4-系統流程圖)
- [5. 時序圖](#5-時序圖)
- [6. 事件流程說明](#6-事件流程說明)
- [7. 業務規則與限制](#7-業務規則與限制)
- [8. 資料流向](#8-資料流向)
- [9. 使用者介面需求](#9-使用者介面需求)
- [10. 非功能性需求](#10-非功能性需求)
- [版本歷史](#版本歷史)

---

## 1. 概述

檔案上傳管理功能是系統中的核心基礎服務，提供統一的檔案儲存、管理和存取能力。本模組支援多種儲存驅動（本地檔案系統、Google Cloud Storage），並提供完整的檔案生命週期管理功能。

### 1.1 系統定位

- **服務類型**：基礎服務（Infrastructure Service）
- **業務角色**：檔案管理中樞
- **關聯模組**：所有需要檔案上傳功能的業務模組
- **使用者群組**：系統使用者、管理員、API 呼叫者

### 1.2 核心價值

- ✅ **統一檔案管理**：提供系統級的檔案上傳、儲存和管理能力
- ✅ **多儲存驅動支援**：支援本地檔案系統和雲端儲存，可靈活切換
- ✅ **安全檔案存取**：提供安全的檔案下載機制，保護檔案資料
- ✅ **檔案元資料管理**：完整記錄檔案的元資料（名稱、大小、類型等）
- ✅ **UUID 唯一識別**：使用 UUID 作為檔案識別碼，確保唯一性和安全性
- ✅ **智能檔案分類**：根據檔案類型自動分類儲存（圖片、文件、影音等）

---

## 2. 功能概述

### 2.1 主要功能

本系統提供檔案的完整生命週期管理，包含以下核心功能：

| 功能編號 | 功能名稱       | 功能說明                                 |
| -------- | -------------- | ---------------------------------------- |
| F01      | 上傳檔案       | 支援 multipart/form-data 格式上傳檔案    |
| F02      | 下載檔案       | 提供安全的檔案下載功能，保留原始檔名     |
| F03      | 查詢上傳記錄   | 查詢單一或多筆檔案上傳記錄               |
| F04      | 列表查詢       | 支援分頁、時間範圍、UUID 篩選的列表查詢  |
| F05      | 儲存驅動切換   | 支援多種儲存驅動（本地、雲端）           |
| F06      | 自動分類儲存   | 根據檔案類型自動分類到不同目錄           |
| F07      | 檔案元資料管理 | 記錄檔案名稱、大小、類型、路徑等元資料   |

### 2.2 支援的儲存驅動

| 驅動類型               | 識別碼                  | 說明                   | 適用場景           |
| ---------------------- | ----------------------- | ---------------------- | ------------------ |
| 本地檔案系統           | local                   | 儲存在伺服器本地磁碟   | 開發、測試環境     |
| Google Cloud Storage   | google-cloud-storage    | 儲存在 GCS 雲端儲存    | 正式環境、雲端部署 |

### 2.3 自動分類目錄

系統根據檔案副檔名自動分類到不同目錄：

| 目錄     | 檔案類型                                               | 說明             |
| -------- | ------------------------------------------------------ | ---------------- |
| images/  | jpg, png, gif, bmp, tiff, ico                          | 圖片檔案         |
| files/   | pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, zip    | 文件和壓縮檔     |
| video/   | mp4, avi, mov, wmv, flv, mpeg                          | 影音檔案         |
| other/   | 其他類型                                               | 其他檔案         |
| public/  | 未指定副檔名                                           | 預設目錄         |

---

## 3. 使用情境範例

### 3.1 情境一：上傳檔案

**流程說明：** 使用者透過 multipart/form-data 格式上傳檔案到系統，系統自動處理檔案儲存、分類和元資料記錄。

**前置條件：**
- 使用者已完成身份認證
- 使用者擁有上傳檔案的權限
- 檔案符合大小和格式限制

**事件流程：**

```
使用者上傳檔案
  │
  ├─> POST /api/upload (multipart/form-data)
  │   FormData:
  │   - file: [Binary Data]
  │   - path: "documents" (可選)
  │   - fileName: "報表.pdf" (可選)
  │
  ├─> [Server] 檔案處理
  │   ├─> 接收檔案資料
  │   │   ├─> originalname: "報表.pdf"
  │   │   ├─> mimetype: "application/pdf"
  │   │   ├─> buffer: [Binary]
  │   │   └─> size: 1024000 (bytes)
  │   │
  │   ├─> 檔案名稱處理
  │   │   ├─> originFileName = formatFileName("報表.pdf")
  │   │   │   └─> "報表.pdf" (格式化後)
  │   │   ├─> fileName = randomUUID() + extname()
  │   │   │   └─> "550e8400-e29b-41d4-a716-446655440000.pdf"
  │   │   └─> directory = getDefaultFolder() 或 dto.path
  │   │       └─> "files" (根據 .pdf 副檔名判斷)
  │   │
  │   ├─> 選擇儲存策略 (Strategy Pattern)
  │   │   ├─> 讀取環境配置：fileSystemDriver
  │   │   └─> 取得對應的 Strategy 實例
  │   │       ├─> local → LocalFileStorageStrategy
  │   │       └─> google-cloud-storage → GoogleCloudStorageStrategy
  │   │
  │   ├─> 執行檔案儲存
  │   │   ├─> strategy.save(directory, fileName, buffer, metadata)
  │   │   │   ├─> contentDisposition: 設定原始檔名
  │   │   │   └─> contentType: 設定 MIME type
  │   │   └─> filePath = "files/550e8400-e29b-41d4-a716-446655440000.pdf"
  │   │
  │   ├─> 建立資料庫記錄
  │   │   └─> INSERT INTO file_storage
  │   │       ├─> uuid: "auto-generated"
  │   │       ├─> path: "files"
  │   │       ├─> driver: "local"
  │   │       ├─> originFileName: "報表.pdf"
  │   │       ├─> fileName: "550e8400-e29b-41d4-a716-446655440000.pdf"
  │   │       ├─> filePath: "files/550e8400-e29b-41d4-a716-446655440000.pdf"
  │   │       ├─> fileType: "application/pdf"
  │   │       ├─> fileSize: 1024000
  │   │       └─> fileUrl: "https://example.com/files/550e..."
  │   │
  │   └─> 返回上傳結果
  │
  ├─> 成功情況：
  │   └─> 返回 200 OK
  │       {
  │         uuid: "abc123-def456-...",
  │         originFileName: "報表.pdf",
  │         fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
  │         fileType: "application/pdf",
  │         fileSize: 1024000,
  │         fileUrl: "https://example.com/files/550e...",
  │         createdAt: "2025-11-17T00:00:00.000Z",
  │         updatedAt: "2025-11-17T00:00:00.000Z"
  │       }
  │
  └─> 失敗情況：
      ├─> 未提供檔案 (400 Bad Request)
      ├─> 檔案大小超過限制 (413 Payload Too Large)
      ├─> 儲存空間不足 (500 Internal Server Error)
      └─> 不支援的檔案類型 (400 Bad Request, 如有實作)
```

**使用場景：**

1. **文件上傳**：使用者上傳報告、合約、證明文件等
2. **圖片上傳**：上傳資產照片、頭像、產品圖片等
3. **附件上傳**：在需求單、申請表單中上傳附件
4. **批次匯入**：上傳 Excel、CSV 檔案進行資料批次匯入
5. **多媒體上傳**：上傳影片、音訊等多媒體檔案

**實作重點：**

- 使用 `@UseInterceptors(FileInterceptor('file'))` 處理 multipart/form-data
- 檔案名稱使用 UUID 避免重複和安全問題
- 保留原始檔名 `originFileName` 供下載時使用
- 使用 Strategy Pattern 支援多種儲存驅動
- 所有檔案操作使用資料庫事務確保一致性
- 檔案大小記錄為 bytes，便於計算和管理

---

### 3.2 情境二：下載檔案

**流程說明：** 使用者透過檔案的 UUID 下載檔案，系統使用串流方式傳輸，並設定正確的 Content-Disposition header 保留原始檔名。

**事件流程：**

```
使用者下載檔案
  │
  ├─> GET /api/upload/:uuid/action/download
  │   Example: GET /api/upload/abc123-def456/action/download
  │
  ├─> [Server] 下載處理
  │   ├─> 查詢檔案記錄 (findOrThrow)
  │   │   └─> SELECT * FROM file_storage WHERE uuid = :uuid
  │   │
  │   ├─> 找到記錄：
  │   │   └─> 記錄資訊
  │   │       ├─> path: "files"
  │   │       ├─> driver: "local"
  │   │       ├─> fileName: "550e8400-e29b-41d4-a716-446655440000.pdf"
  │   │       ├─> originFileName: "報表.pdf"
  │   │       ├─> fileType: "application/pdf"
  │   │       └─> fileSize: 1024000
  │   │
  │   ├─> 選擇下載策略
  │   │   └─> 根據 driver 取得對應的 Strategy
  │   │       └─> strategyMap.get(driver)
  │   │
  │   ├─> 執行檔案讀取
  │   │   ├─> strategy.download(path, fileName)
  │   │   │   ├─> local: 從本地檔案系統讀取
  │   │   │   └─> GCS: 從雲端儲存下載
  │   │   │
  │   │   └─> 返回 Buffer
  │   │
  │   ├─> 設定回應 Headers
  │   │   ├─> Content-Type: "application/pdf"
  │   │   └─> Content-Disposition: "attachment; filename*=utf-8''%E5%A0%B1%E8%A1%A8.pdf"
  │   │       (使用 encodeURI 處理中文檔名)
  │   │
  │   └─> 傳送檔案內容
  │       └─> res.end(buffer)
  │
  ├─> 成功情況：
  │   └─> 返回 200 OK
  │       ├─> Headers 設定正確
  │       ├─> 瀏覽器觸發下載對話框
  │       └─> 檔名顯示為 "報表.pdf" (原始檔名)
  │
  └─> 失敗情況：
      ├─> UUID 格式錯誤 (400 Bad Request)
      ├─> 檔案不存在 (404 Not Found)
      ├─> 檔案已被刪除 (404 Not Found)
      └─> 儲存驅動異常 (500 Internal Server Error)
```

**使用場景：**

1. **檔案預覽**：在瀏覽器中預覽 PDF、圖片等檔案
2. **檔案下載**：下載附件、報表、文件等
3. **資料匯出**：下載系統產生的 Excel、CSV 等檔案
4. **備份還原**：下載備份檔案
5. **分享檔案**：透過 URL 分享檔案給其他使用者

**實作重點：**

- 使用 `@Res()` 裝飾器直接控制 Response 物件
- Content-Disposition 使用 RFC 5987 格式支援中文檔名
- 使用 `encodeURI()` 處理檔名特殊字元
- 檔案以 Buffer 方式傳輸，支援大檔案
- 設定正確的 Content-Type 讓瀏覽器正確處理
- 不需要手動設定 Content-Length，Express 會自動處理

**注意事項：**

- ⚠️ 下載大檔案時可能消耗較多記憶體，建議實作串流下載
- ⚠️ 確保檔案存取權限控制，避免未授權存取
- ⚠️ 中文檔名使用 UTF-8 編碼，確保跨瀏覽器相容性

---

### 3.3 情境三：查詢上傳記錄列表

**流程說明：** 管理員查詢系統中的檔案上傳記錄，支援分頁、時間範圍篩選和 UUID 批次查詢。

**事件流程：**

```
查詢上傳記錄列表
  │
  ├─> GET /api/upload
  │   Query Parameters:
  │   - page: 1
  │   - limit: 20
  │   - uuids: "abc123,def456" (可選)
  │   - startAt: "2025-11-01T00:00:00.000Z" (可選)
  │   - endAt: "2025-11-17T23:59:59.999Z" (可選)
  │
  ├─> [Server] 查詢處理
  │   ├─> 解析查詢參數
  │   │   ├─> page: 1
  │   │   ├─> limit: 20
  │   │   ├─> uuids: ["abc123", "def456"] (自動分割)
  │   │   ├─> startAt: Date 物件 (自動轉換)
  │   │   └─> endAt: Date 物件 (自動轉換)
  │   │
  │   ├─> 建構查詢條件 (未實作，但 DTO 已定義)
  │   │   ├─> WHERE uuid IN (:uuids) (如有提供)
  │   │   ├─> AND createdAt >= :startAt (如有提供)
  │   │   └─> AND createdAt <= :endAt (如有提供)
  │   │
  │   ├─> 執行分頁查詢
  │   │   └─> prisma.fileStorage.pagination({
  │   │       page, limit,
  │   │       orderBy: { createdAt: 'desc' }
  │   │     })
  │   │
  │   └─> 計算分頁資訊
  │
  └─> 返回結果
      {
        data: [
          {
            uuid: "abc123-def456-...",
            originFileName: "報表.pdf",
            fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
            fileType: "application/pdf",
            fileSize: 1024000,
            fileUrl: "https://example.com/files/550e...",
            createdAt: "2025-11-17T00:00:00.000Z",
            updatedAt: "2025-11-17T00:00:00.000Z"
          },
          ...
        ],
        meta: {
          totalCount: 150
        }
      }
```

**使用場景：**

1. **檔案管理後台**：管理員檢視所有上傳檔案
2. **稽核記錄**：查看特定時間範圍內的上傳記錄
3. **批次操作**：選擇多個檔案進行批次處理
4. **儲存空間管理**：統計各類型檔案的儲存使用量
5. **問題排查**：查找特定 UUID 的檔案上傳記錄

**實作重點：**

- 預設按 `createdAt` 降序排列，最新上傳的在前
- `uuids` 參數支援逗號分隔的字串，自動轉換為陣列
- `startAt` 和 `endAt` 自動轉換為 Date 物件
- 目前查詢條件過濾尚未實作，但 DTO 已定義欄位
- 使用 `ResourceListEntity` 統一列表回應格式
- 回應中不包含內部欄位（path, driver, filePath, deletedAt）

---

### 3.4 情境四：查詢單一上傳記錄

**流程說明：** 根據 UUID 查詢特定檔案的詳細資訊。

**事件流程：**

```
查詢單一上傳記錄
  │
  ├─> GET /api/upload/:uuid
  │   Example: GET /api/upload/abc123-def456
  │
  ├─> [Server] 查詢處理
  │   ├─> 驗證 UUID 格式（自動處理）
  │   ├─> 查詢資料庫
  │   │   └─> SELECT * FROM file_storage WHERE uuid = :uuid
  │   │
  │   ├─> 找到記錄：
  │   │   └─> 返回檔案資訊
  │   │
  │   └─> 未找到記錄：
  │       └─> 拋出 404 Not Found
  │
  ├─> 成功情況：
  │   └─> 返回 200 OK
  │       {
  │         uuid: "abc123-def456-...",
  │         originFileName: "報表.pdf",
  │         fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
  │         fileType: "application/pdf",
  │         fileSize: 1024000,
  │         fileUrl: "https://example.com/files/550e...",
  │         createdAt: "2025-11-17T00:00:00.000Z",
  │         updatedAt: "2025-11-17T00:00:00.000Z"
  │       }
  │
  └─> 失敗情況：
      ├─> UUID 格式錯誤 (400 Bad Request)
      └─> 檔案不存在 (404 Not Found)
```

**使用場景：**

1. **檔案資訊檢視**：查看檔案的詳細元資料
2. **關聯查詢**：在業務模組中查詢關聯的檔案資訊
3. **檔案驗證**：驗證特定 UUID 的檔案是否存在
4. **連結有效性檢查**：檢查檔案連結是否仍然有效

**實作重點：**

- 使用 `findOrThrow` 方法，簡化錯誤處理
- UUID 不存在時，返回明確的錯誤訊息
- 回應格式與列表查詢的單筆資料一致
- 不包含內部實作欄位（path, driver 等）

---

### 3.5 情境五：多儲存驅動切換

**流程說明：** 系統管理員根據部署環境切換儲存驅動，從本地檔案系統遷移到雲端儲存。

**事件流程：**

```
儲存驅動切換場景
  │
  ├─> [配置變更]
  │   ├─> 開發環境配置
  │   │   └─> thirdParty.fileSystemDriver = "local"
  │   │
  │   └─> 正式環境配置
  │       └─> thirdParty.fileSystemDriver = "google-cloud-storage"
  │
  ├─> [應用程式啟動]
  │   ├─> UploadService 建構子執行
  │   │   ├─> 讀取 fileSystemDriver 配置
  │   │   └─> 初始化 strategyMap
  │   │       ├─> local → LocalFileStorageStrategy
  │   │       └─> google-cloud-storage → GoogleCloudStorageStrategy
  │   │
  │   └─> 策略已準備就緒
  │
  ├─> [上傳流程]
  │   ├─> 根據配置選擇策略
  │   │   └─> strategy = strategyMap.get(this.driver)
  │   │
  │   ├─> local 驅動：
  │   │   ├─> 儲存到本地檔案系統
  │   │   ├─> 路徑：/uploads/files/xxx.pdf
  │   │   └─> fileUrl: "http://localhost:3000/files/xxx.pdf"
  │   │
  │   └─> google-cloud-storage 驅動：
  │       ├─> 上傳到 GCS Bucket
  │       ├─> 路徑：gs://bucket-name/files/xxx.pdf
  │       └─> fileUrl: "https://storage.googleapis.com/bucket/files/xxx.pdf"
  │
  ├─> [下載流程]
  │   ├─> 讀取檔案記錄中的 driver 欄位
  │   ├─> 選擇對應的下載策略
  │   │   └─> strategy = strategyMap.get(orm.driver)
  │   │
  │   ├─> local 驅動：
  │   │   └─> 從本地檔案系統讀取
  │   │
  │   └─> google-cloud-storage 驅動：
  │       └─> 從 GCS 下載
  │
  └─> [優勢]
      ├─> 無需修改業務邏輯代碼
      ├─> 策略動態切換
      ├─> 支援混合儲存（舊檔案在本地，新檔案在雲端）
      └─> 易於擴展新的儲存驅動
```

**使用場景：**

1. **環境切換**：開發環境使用本地儲存，正式環境使用雲端儲存
2. **災難復原**：主要儲存失效時，快速切換到備用儲存
3. **成本優化**：根據使用量選擇最經濟的儲存方案
4. **合規要求**：滿足資料主權、隱私法規的儲存位置要求
5. **漸進式遷移**：逐步將舊檔案從本地遷移到雲端

**實作重點：**

- 使用 Strategy Pattern 實現儲存驅動抽象化
- 每個檔案記錄保存 `driver` 欄位，支援混合儲存
- 上傳時使用當前配置的驅動
- 下載時使用檔案記錄中的驅動
- 策略在應用程式啟動時初始化，避免重複建立實例
- 新增儲存驅動只需：
  1. 實作 `IFileStorageStrategy` 介面
  2. 在 `strategyMap` 中註冊
  3. 更新配置檔

---

### 3.6 情境六：自動檔案分類儲存

**流程說明：** 系統根據檔案類型自動分類到不同目錄，便於管理和組織。

**事件流程：**

```
自動檔案分類
  │
  ├─> 使用者上傳檔案（未指定 path）
  │   └─> POST /api/upload
  │       FormData: { file: "產品圖片.jpg" }
  │
  ├─> [檔案分類邏輯]
  │   ├─> 取得檔案名稱：originFileName = "產品圖片.jpg"
  │   ├─> 提取副檔名：ext = "jpg"
  │   └─> 執行 getDefaultFolder(originFileName)
  │       │
  │       ├─> 圖片類型判斷
  │       │   └─> ext in ['jpg', 'png', 'gif', 'bmp', 'tiff', 'ico', 'tif']
  │       │       → return "images"
  │       │
  │       ├─> 文件類型判斷
  │       │   └─> ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  │       │                'txt', 'csv', 'zip', '7z', 'gzip', 'iso', 'rar', 'tar']
  │       │       → return "files"
  │       │
  │       ├─> 影音類型判斷
  │       │   └─> ext in ['mp3', 'avi', 'mp4', 'wav', 'flv', 'mpg', 'mpeg',
  │       │                'mov', 'rmvb', 'wmv', 'swf']
  │       │       → return "video"
  │       │
  │       ├─> 其他類型
  │       │   └─> ext not in above lists
  │       │       → return "other"
  │       │
  │       └─> 無副檔名
  │           └─> filename has no extension
  │               → return "public"
  │
  ├─> 檔案儲存
  │   ├─> directory = "images"
  │   ├─> fileName = "550e8400-e29b-41d4-a716-446655440000.jpg"
  │   └─> filePath = "images/550e8400-e29b-41d4-a716-446655440000.jpg"
  │
  └─> 儲存結果
      └─> 檔案被分類儲存到 images/ 目錄
```

**分類對照表：**

| 副檔名範例         | 分類目錄 | 說明                   |
| ------------------ | -------- | ---------------------- |
| .jpg, .png, .gif   | images/  | 圖片檔案               |
| .pdf, .docx, .xlsx | files/   | 文件和壓縮檔           |
| .mp4, .avi, .mov   | video/   | 影音檔案               |
| .exe, .dll         | other/   | 其他類型               |
| (無副檔名)         | public/  | 預設目錄               |

**使用場景：**

1. **圖片管理**：產品圖片、使用者頭像自動分類到 images/
2. **文件歸檔**：合約、報告自動分類到 files/
3. **多媒體儲存**：教學影片、錄音檔自動分類到 video/
4. **混合上傳**：批次上傳不同類型檔案，系統自動分類
5. **備份管理**：備份檔案自動分類到 other/

**實作重點：**

- `getDefaultFolder()` 方法處理自動分類邏輯
- 使用者可透過 `dto.path` 覆寫自動分類
- 分類基於副檔名，不區分大小寫
- 支援的副檔名列表可根據需求擴充
- 分類目錄有助於：
  - 檔案管理和瀏覽
  - 存取權限控制
  - 儲存空間配額管理
  - 備份策略制定

**注意事項：**

- ⚠️ 副檔名可能被偽造，不應作為安全驗證的唯一依據
- ⚠️ 建議結合 MIME type 驗證確保檔案類型正確
- ⚠️ 目錄結構應與儲存驅動的實作協調一致

---

## 4. 系統流程圖

### 4.1 上傳檔案流程

```
使用者發起上傳請求
  │
  ├─> POST /api/upload (multipart/form-data)
  │   FormData: { file, path?, fileName? }
  │
  ├─> [Controller] 接收請求
  │   ├─> FileInterceptor('file') 處理檔案
  │   ├─> ParseFilePipe 驗證檔案存在
  │   ├─> 參數驗證 (CreateUploadDto)
  │   └─> 呼叫 Service.create(file, dto)
  │
  ├─> [Service] 上傳處理
  │   ├─> 解析檔案資訊
  │   │   ├─> originalname: 原始檔名
  │   │   ├─> mimetype: MIME type
  │   │   ├─> buffer: 檔案內容
  │   │   └─> size: 檔案大小
  │   │
  │   ├─> 檔案名稱處理
  │   │   ├─> originFileName = formatFileName(dto.fileName ?? originalname)
  │   │   ├─> fileName = randomUUID() + extname(originFileName)
  │   │   └─> directory = dto.path ?? getDefaultFolder(originFileName)
  │   │
  │   ├─> 選擇儲存策略
  │   │   ├─> driver = config.fileSystemDriver
  │   │   └─> strategy = strategyMap.get(driver)
  │   │
  │   ├─> 執行檔案儲存
  │   │   ├─> strategy.save(directory, fileName, buffer, metadata)
  │   │   │   ├─> contentDisposition: 設定原始檔名
  │   │   │   └─> contentType: 設定 MIME type
  │   │   │
  │   │   └─> filePath = directory + "/" + fileName
  │   │
  │   ├─> 取得公開下載 URL
  │   │   └─> fileUrl = strategy.getPublicDownloadUrl(directory, fileName)
  │   │
  │   ├─> 建構 Prisma CreateInput
  │   │   └─> FileStorageCreateInput {
  │   │       path, driver, originFileName, fileName,
  │   │       filePath, fileType, fileSize, fileUrl
  │   │     }
  │   │
  │   ├─> 使用事務建立記錄
  │   │   └─> tx.fileStorage.create({ data })
  │   │
  │   ├─> 錯誤處理 (catchPrismaErrorOrThrow)
  │   └─> plainToInstance(UploadEntity, orm)
  │
  └─> [Controller] 返回回應
      └─> 200 OK + UploadEntity
```

### 4.2 下載檔案流程

```
使用者發起下載請求
  │
  ├─> GET /api/upload/:uuid/action/download
  │
  ├─> [Controller] 接收請求
  │   ├─> 路徑參數：uuid
  │   └─> 呼叫 Service.download(uuid)
  │
  ├─> [Service] 下載處理
  │   ├─> 查詢檔案記錄 (findOrThrow)
  │   │   ├─> SELECT * FROM file_storage WHERE uuid = :uuid
  │   │   │
  │   │   ├─> 找到：繼續下載
  │   │   └─> 未找到：拋出 404 錯誤
  │   │
  │   ├─> 選擇下載策略
  │   │   ├─> driver = orm.driver
  │   │   └─> strategy = strategyMap.get(driver)
  │   │
  │   ├─> 執行檔案讀取
  │   │   ├─> buffer = strategy.download(orm.path, orm.fileName)
  │   │   │   ├─> local: fs.readFile()
  │   │   │   └─> GCS: bucket.file().download()
  │   │   │
  │   │   └─> 返回 { upload: orm, buffer }
  │   │
  │   └─> 返回給 Controller
  │
  ├─> [Controller] 回應處理
  │   ├─> 檔名編碼處理
  │   │   └─> downloadName = encodeURI(upload.originFileName)
  │   │
  │   ├─> 設定回應 Headers
  │   │   ├─> Content-Type: upload.fileType
  │   │   └─> Content-Disposition: "attachment; filename*=utf-8''${downloadName}"
  │   │
  │   └─> 傳送檔案
  │       └─> res.end(buffer)
  │
  └─> 使用者接收檔案
      ├─> 瀏覽器觸發下載
      └─> 檔名顯示為原始檔名
```

### 4.3 查詢列表流程

```
使用者查詢列表
  │
  ├─> GET /api/upload?page=1&limit=20&uuids=...&startAt=...&endAt=...
  │
  ├─> [Controller] 接收請求
  │   ├─> 參數驗證 (FindAllQueryDto)
  │   │   ├─> page, limit (PaginationQueryDto)
  │   │   ├─> uuids (自動分割逗號分隔字串)
  │   │   ├─> startAt (自動轉換為 Date)
  │   │   └─> endAt (自動轉換為 Date)
  │   │
  │   └─> 呼叫 Service.findAll(query)
  │
  ├─> [Service] 查詢處理
  │   ├─> 執行分頁查詢
  │   │   └─> prisma.fileStorage.pagination({
  │   │       page,
  │   │       limit,
  │   │       orderBy: { createdAt: 'desc' }
  │   │     })
  │   │   (註：WHERE 條件過濾尚未實作)
  │   │
  │   ├─> 執行查詢
  │   │   ├─> SELECT * FROM file_storage
  │   │   │   ORDER BY created_at DESC
  │   │   │   LIMIT :limit OFFSET :offset
  │   │   │
  │   │   └─> SELECT COUNT(*) FROM file_storage
  │   │
  │   ├─> 轉換為 Entity
  │   │   └─> plainToInstance(UploadEntity, result)
  │   │
  │   └─> 返回 [data, totalCount]
  │
  └─> [Controller] 返回回應
      └─> ResourceListEntity(data, { totalCount })
```

---

## 5. 時序圖

### 5.1 上傳檔案時序圖

```
[客戶端]     [Controller]     [Service]      [Strategy]    [Storage]    [Prisma]      [資料庫]
   │              │               │              │             │            │             │
   ├─ POST────────>│               │              │             │            │             │
   │  multipart/   │               │              │             │            │             │
   │  form-data    │ (接收檔案)     │              │             │            │             │
   │              │               │              │             │            │             │
   │              ├─ create()────>│              │             │            │             │
   │              │               │ (檔名處理)    │             │            │             │
   │              │               │ (選擇策略)    │             │            │             │
   │              │               │              │             │            │             │
   │              │               ├─ save()─────>│             │            │             │
   │              │               │              │ (儲存檔案)  │            │             │
   │              │               │              ├─ write─────>│            │             │
   │              │               │              │             │ (寫入)     │             │
   │              │               │              │<─ 成功──────┤            │             │
   │              │               │<─ filePath───┤             │            │             │
   │              │               │              │             │            │             │
   │              │               ├─ getPublicUrl>│            │            │             │
   │              │               │<─ fileUrl────┤             │            │             │
   │              │               │              │             │            │             │
   │              │               │ (建構 Input)  │             │            │             │
   │              │               ├─ $transaction────────────────────────────>│            │
   │              │               │              │             │            ├─ INSERT────>│
   │              │               │              │             │            │<─ 新記錄────┤
   │              │               │<─ ORM ─────────────────────────────────┤             │
   │              │               │ (轉換Entity)  │             │            │             │
   │              │<─ Entity──────┤              │             │            │             │
   │<─ 200 OK─────┤               │              │             │            │             │
   │  + Entity    │               │              │             │            │             │
   │              │               │              │             │            │             │
```

### 5.2 下載檔案時序圖

```
[客戶端]     [Controller]     [Service]      [Strategy]    [Storage]    [Prisma]      [資料庫]
   │              │               │              │             │            │             │
   ├─ GET─────────>│               │              │             │            │             │
   │  /:uuid/      │               │              │             │            │             │
   │  /download    │               │              │             │            │             │
   │              ├─ download()──>│              │             │            │             │
   │              │               ├─ findOrThrow──────────────────────────────>│            │
   │              │               │              │             │            ├─ SELECT────>│
   │              │               │              │             │            │<─ 記錄──────┤
   │              │               │<─ ORM ─────────────────────────────────┤             │
   │              │               │              │             │            │             │
   │              │               │ (選擇策略)    │             │            │             │
   │              │               ├─ download()─>│             │            │             │
   │              │               │              ├─ read──────>│            │             │
   │              │               │              │<─ buffer────┤            │             │
   │              │               │<─ buffer─────┤             │            │             │
   │              │<─ {upload,────┤              │             │            │             │
   │              │    buffer}    │              │             │            │             │
   │              │               │              │             │            │             │
   │              │ (設定Headers)  │              │             │            │             │
   │<─ 200 OK─────┤               │              │             │            │             │
   │  + Buffer    │               │              │             │            │             │
   │  (檔案內容)   │               │              │             │            │             │
   │              │               │              │             │            │             │
```

### 5.3 查詢列表時序圖

```
[客戶端]     [Controller]     [Service]      [Prisma]      [資料庫]
   │              │               │              │             │
   ├─ GET─────────>│               │              │             │
   │  ?page=1&    │ (參數驗證)     │              │             │
   │  limit=20    │               │              │             │
   │              ├─ findAll()───>│              │             │
   │              │               ├─ pagination─>│             │
   │              │               │              ├─ SELECT────>│
   │              │               │              │ + ORDER BY  │
   │              │               │              │ + LIMIT     │
   │              │               │              ├─ COUNT─────>│
   │              │               │              │<─ 結果+總數─┤
   │              │               │<─ {result,───┤             │
   │              │               │    meta}     │             │
   │              │               │ (轉換Entity)  │             │
   │              │<─ [data,──────┤              │             │
   │              │    count]     │              │             │
   │              │ (包裝回應)     │              │             │
   │<─ 200 OK─────┤               │              │             │
   │  ResourceList│               │              │             │
   │              │               │              │             │
```

---

## 6. 事件流程說明

### 6.1 上傳檔案事件流程

| 步驟 | 角色       | 動作                           | 說明                               |
| ---- | ---------- | ------------------------------ | ---------------------------------- |
| 1    | 客戶端     | 發送 POST 請求                 | multipart/form-data 格式           |
| 2    | Controller | 接收請求並驗證參數             | FileInterceptor + ParseFilePipe    |
| 3    | Controller | 呼叫 Service.create()          | 傳遞檔案和 DTO                     |
| 4    | Service    | 解析檔案資訊                   | originalname, mimetype, buffer 等  |
| 5    | Service    | 處理檔案名稱                   | 格式化、生成 UUID、決定目錄        |
| 6    | Service    | 選擇儲存策略                   | 根據 driver 配置取得 Strategy      |
| 7    | Strategy   | 儲存檔案到儲存系統             | 本地或雲端儲存                     |
| 8    | Service    | 取得公開下載 URL               | 由 Strategy 提供                   |
| 9    | Service    | 建構資料庫 CreateInput         | 準備所有欄位資料                   |
| 10   | Prisma     | 執行 INSERT 操作               | 使用事務寫入資料庫                 |
| 11   | Service    | 轉換為 Entity                  | 使用 plainToInstance              |
| 12   | Controller | 返回 HTTP 200 OK               | 包含上傳成功的 Entity              |

### 6.2 下載檔案事件流程

| 步驟 | 角色       | 動作                           | 說明                               |
| ---- | ---------- | ------------------------------ | ---------------------------------- |
| 1    | 客戶端     | 發送 GET 請求                  | 包含 UUID 路徑參數                 |
| 2    | Controller | 接收請求                       | 提取 UUID                          |
| 3    | Service    | 查詢檔案記錄                   | findOrThrow，不存在則拋出 404      |
| 4    | Service    | 選擇下載策略                   | 根據記錄中的 driver 欄位           |
| 5    | Strategy   | 讀取檔案內容                   | 從儲存系統讀取                     |
| 6    | Service    | 返回檔案資料                   | 包含 orm 和 buffer                 |
| 7    | Controller | 編碼檔名                       | 使用 encodeURI 處理特殊字元        |
| 8    | Controller | 設定 HTTP Headers              | Content-Type, Content-Disposition  |
| 9    | Controller | 傳送檔案內容                   | res.end(buffer)                    |
| 10   | 客戶端     | 接收檔案                       | 瀏覽器觸發下載                     |

### 6.3 查詢列表事件流程

| 步驟 | 角色       | 動作                           | 說明                               |
| ---- | ---------- | ------------------------------ | ---------------------------------- |
| 1    | 客戶端     | 發送 GET 請求                  | 包含分頁和篩選參數                 |
| 2    | Controller | 驗證查詢參數                   | FindAllQueryDto 自動驗證和轉換     |
| 3    | Service    | 執行分頁查詢                   | 使用 prisma.pagination()           |
| 4    | Prisma     | 執行資料庫查詢                 | SELECT + COUNT                     |
| 5    | Service    | 轉換為 Entity 陣列             | 使用 plainToInstance              |
| 6    | Service    | 返回資料和總數                 | [data, totalCount]                 |
| 7    | Controller | 包裝為 ResourceListEntity      | 統一的列表回應格式                 |
| 8    | Controller | 返回 HTTP 200 OK               | 包含 data 和 meta                  |

---

## 7. 業務規則與限制

### 7.1 檔案驗證規則

| 驗證項目       | 規則                     | 錯誤訊息範例                    |
| -------------- | ------------------------ | ------------------------------- |
| 檔案必填       | 必須提供檔案             | "file is required"              |
| 檔案大小       | 依伺服器配置限制         | "Payload Too Large"             |
| MIME type      | 依業務需求限制（建議）   | "不支援的檔案類型"              |
| 檔案名稱長度   | 依資料庫欄位定義         | 建議不超過 255 字元             |

### 7.2 檔案命名規則

1. **原始檔名（originFileName）**
   - 保留使用者上傳的檔案名稱
   - 經過 `formatFileName()` 處理
   - 用於下載時顯示給使用者

2. **儲存檔名（fileName）**
   - 使用 UUID + 原始副檔名
   - 格式：`550e8400-e29b-41d4-a716-446655440000.pdf`
   - 確保唯一性，避免檔名衝突
   - 提升安全性，防止路徑遍歷攻擊

3. **檔案路徑（filePath）**
   - 格式：`{directory}/{fileName}`
   - 範例：`files/550e8400-e29b-41d4-a716-446655440000.pdf`
   - 完整的儲存路徑

### 7.3 儲存驅動規則

1. **驅動選擇**
   - 上傳時使用當前配置的 `fileSystemDriver`
   - 每個檔案記錄保存其 `driver` 欄位
   - 下載時使用檔案記錄中的 `driver`

2. **混合儲存支援**
   - 系統可同時存在多種驅動的檔案
   - 舊檔案可能在本地，新檔案在雲端
   - 每個檔案獨立管理其儲存位置

3. **Strategy Pattern**
   - 所有 Strategy 必須實作 `IFileStorageStrategy` 介面
   - 提供 `save()` 和 `download()` 方法
   - 提供 `getPublicDownloadUrl()` 方法

### 7.4 目錄分類規則

1. **自動分類**
   - 根據副檔名自動判斷目錄
   - 不區分大小寫
   - 預設目錄為 `public`

2. **手動指定**
   - 透過 `dto.path` 可覆寫自動分類
   - 允許自訂目錄結構
   - 建議遵循既有的分類慣例

3. **目錄結構**
   - `images/` - 圖片檔案
   - `files/` - 文件檔案
   - `video/` - 影音檔案
   - `other/` - 其他類型
   - `public/` - 公開檔案或無副檔名檔案

### 7.5 下載安全規則

1. **檔案存取驗證**
   - 必須提供有效的 UUID
   - 檔案必須存在且未被刪除
   - 建議加入權限檢查（目前未實作）

2. **檔名編碼**
   - 使用 RFC 5987 格式
   - UTF-8 編碼處理中文檔名
   - `filename*=utf-8''%E5%A0%B1%E8%A1%A8.pdf`

3. **Content-Type 設定**
   - 使用檔案記錄中的 `fileType`
   - 確保瀏覽器正確處理檔案
   - 避免安全風險（如 XSS）

### 7.6 系統限制

| 項目           | 限制                     | 說明                           |
| -------------- | ------------------------ | ------------------------------ |
| 檔案大小       | 依伺服器配置             | 預設通常為 10-100MB            |
| 檔案名稱長度   | 255 字元                 | 資料庫 VARCHAR 限制            |
| UUID 格式      | 標準 UUID v4             | 36 字元（含連字號）            |
| 並發上傳       | 依伺服器資源             | 建議限制同時上傳數量           |
| 儲存空間       | 依儲存系統配額           | 本地或雲端儲存限制             |

### 7.7 錯誤處理規則

1. **上傳錯誤**
   - 未提供檔案：400 Bad Request
   - 檔案過大：413 Payload Too Large
   - 儲存失敗：500 Internal Server Error
   - 不支援的檔案類型：400 Bad Request（如有實作）

2. **下載錯誤**
   - UUID 格式錯誤：400 Bad Request
   - 檔案不存在：404 Not Found
   - 儲存驅動異常：500 Internal Server Error
   - 檔案讀取失敗：500 Internal Server Error

3. **查詢錯誤**
   - 參數驗證失敗：400 Bad Request
   - 分頁參數錯誤：400 Bad Request

---

## 8. 資料流向

### 8.1 整體資料流向

```
客戶端應用程式
  │
  ├─> [HTTP Request] 檔案上傳/下載請求
  │   └─> /api/upload
  │
  ↓
NestJS Controller
  │
  ├─> 檔案處理 (FileInterceptor)
  ├─> 參數驗證 (class-validator)
  ├─> 身份認證 (JWT)
  └─> 權限檢查
  │
  ↓
Service 層
  │
  ├─> 業務邏輯處理
  ├─> 檔案名稱處理
  ├─> 策略選擇
  └─> 檔案儲存/讀取
  │
  ↓
Strategy 層（儲存驅動）
  │
  ├─> LocalFileStorageStrategy (本地)
  │   ├─> 本地檔案系統讀寫
  │   └─> 檔案路徑管理
  │
  └─> GoogleCloudStorageStrategy (雲端)
      ├─> GCS API 呼叫
      └─> Bucket 管理
  │
  ↓
儲存系統
  │
  ├─> 本地檔案系統
  │   └─> /uploads/{directory}/{fileName}
  │
  └─> Google Cloud Storage
      └─> gs://bucket-name/{directory}/{fileName}
  │
  ↓ (元資料)
Prisma ORM
  │
  └─> 建構 SQL 查詢
      ├─> 事務管理
      └─> 執行資料庫操作
  │
  ↓
PostgreSQL 資料庫
  │
  ├─> file_storage 資料表
  │   └─> 檔案元資料持久化
  └─> 返回查詢結果
  │
  ↓
Service 層
  │
  └─> plainToInstance (轉換為 Entity)
  │
  ↓
Controller
  │
  ├─> 包裝回應格式
  └─> 設定 HTTP 狀態碼
  │
  ↓
客戶端應用程式
  │
  └─> [HTTP Response] JSON 或檔案內容
```

### 8.2 上傳操作資料流

```
Multipart FormData
  { file: [Binary], path?: string, fileName?: string }
  │
  ↓ (FileInterceptor)
Express.Multer.File
  {
    originalname: "報表.pdf",
    mimetype: "application/pdf",
    buffer: Buffer,
    size: 1024000
  }
  │
  ↓ (Service 處理)
檔案儲存資訊
  {
    originFileName: "報表.pdf",
    fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
    directory: "files",
    filePath: "files/550e8400-e29b-41d4-a716-446655440000.pdf"
  }
  │
  ↓ (Strategy.save)
儲存系統
  [檔案實體儲存完成]
  │
  ↓ (建構 CreateInput)
Prisma.FileStorageCreateInput
  {
    path: "files",
    driver: "local",
    originFileName: "報表.pdf",
    fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
    filePath: "files/550e8400-e29b-41d4-a716-446655440000.pdf",
    fileType: "application/pdf",
    fileSize: 1024000,
    fileUrl: "http://localhost:3000/files/550e..."
  }
  │
  ↓ (tx.create)
FileStorage (ORM 物件)
  {
    uuid: "abc123-def456-...",
    createdAt: Date,
    updatedAt: Date,
    ...其他欄位
  }
  │
  ↓ (plainToInstance)
UploadEntity
  (只包含公開欄位)
  │
  ↓
HTTP 200 OK
  {
    uuid: "abc123-def456-...",
    originFileName: "報表.pdf",
    fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
    fileType: "application/pdf",
    fileSize: 1024000,
    fileUrl: "http://localhost:3000/files/550e...",
    createdAt: "2025-11-17T00:00:00.000Z",
    updatedAt: "2025-11-17T00:00:00.000Z"
  }
```

### 8.3 下載操作資料流

```
HTTP GET /api/upload/:uuid/action/download
  │
  ↓ (Service.findOrThrow)
FileStorage ORM
  {
    uuid: "abc123-def456-...",
    path: "files",
    driver: "local",
    fileName: "550e8400-e29b-41d4-a716-446655440000.pdf",
    originFileName: "報表.pdf",
    fileType: "application/pdf",
    ...
  }
  │
  ↓ (Strategy.download)
Buffer
  [檔案二進位內容]
  │
  ↓ (Controller 處理)
HTTP Response
  Headers:
    Content-Type: "application/pdf"
    Content-Disposition: "attachment; filename*=utf-8''%E5%A0%B1%E8%A1%A8.pdf"
  Body:
    [Binary Data]
  │
  ↓
客戶端
  下載檔案 "報表.pdf"
```

---

## 9. 使用者介面需求

### 9.1 檔案上傳介面

**上傳元件**

| 元件         | 說明                                   | 互動行為                   |
| ------------ | -------------------------------------- | -------------------------- |
| 檔案選擇器   | 選擇要上傳的檔案                       | 點擊或拖拽上傳             |
| 進度條       | 顯示上傳進度                           | 即時更新百分比             |
| 預覽區       | 上傳前預覽檔案（圖片、PDF 等）         | 縮圖或預覽視窗             |
| 取消按鈕     | 取消上傳操作                           | 中斷上傳請求               |
| 上傳按鈕     | 確認上傳                               | 觸發上傳請求               |
| 檔案清單     | 顯示已選檔案                           | 可移除檔案                 |

**表單欄位（可選）**

| 欄位名稱     | 類型       | 必填 | 說明                   | 預設值         |
| ------------ | ---------- | ---- | ---------------------- | -------------- |
| 檔案         | File       | 是   | 要上傳的檔案           | -              |
| 儲存路徑     | 下拉選單   | 否   | 選擇儲存目錄           | 自動分類       |
| 自訂檔名     | 文字輸入   | 否   | 指定檔案顯示名稱       | 使用原始檔名   |

**上傳狀態顯示**

- 等待上傳：顯示檔案資訊
- 上傳中：顯示進度條和百分比
- 上傳成功：顯示成功訊息和檔案連結
- 上傳失敗：顯示錯誤訊息和重試按鈕

### 9.2 檔案管理介面

**檔案列表頁面**

| 欄位         | 說明                   | 操作                   |
| ------------ | ---------------------- | ---------------------- |
| 縮圖         | 檔案類型圖示或縮圖     | 點擊預覽               |
| 檔案名稱     | 顯示原始檔名           | 點擊下載               |
| 檔案類型     | MIME type              | 顯示                   |
| 檔案大小     | 格式化顯示（KB/MB）    | 顯示                   |
| 上傳時間     | 格式化顯示日期時間     | 顯示                   |
| 操作         | 下載、刪除、複製連結   | 按鈕群組               |

**篩選功能**

- 時間範圍篩選：開始日期、結束日期
- 檔案類型篩選：圖片、文件、影音等
- 關鍵字搜尋：檔案名稱
- UUID 批次查詢：輸入多個 UUID（逗號分隔）

**批次操作**

- 勾選多個檔案
- 批次下載（打包為 ZIP）
- 批次刪除（需確認）
- 批次移動到其他目錄

### 9.3 檔案預覽介面

**支援預覽的檔案類型**

| 檔案類型 | 預覽方式               | 說明                   |
| -------- | ---------------------- | ---------------------- |
| 圖片     | 內嵌顯示               | 支援縮放、旋轉         |
| PDF      | PDF.js 或內嵌 iframe   | 支援翻頁、搜尋         |
| 影音     | HTML5 video/audio      | 支援播放控制           |
| 文字     | 內嵌顯示               | 語法高亮（如適用）     |
| 其他     | 顯示檔案資訊           | 僅提供下載             |

**預覽視窗功能**

- 檔案資訊顯示（名稱、大小、類型、上傳時間）
- 下載按鈕
- 關閉按鈕
- 上一個/下一個檔案（列表預覽）

### 9.4 整合範例

**資產管理頁面整合**

```
資產編輯表單
  ├─> 基本資訊欄位
  ├─> 照片上傳區
  │   ├─> 拖拽上傳或點擊選擇
  │   ├─> 預覽縮圖（3-5 張）
  │   └─> 主要照片標記
  ├─> 附件上傳區
  │   ├─> 文件列表
  │   ├─> 上傳按鈕
  │   └─> 下載/刪除操作
  └─> 儲存按鈕
```

---

## 10. 非功能性需求

### 10.1 效能需求

| 項目           | 需求                       | 說明                           |
| -------------- | -------------------------- | ------------------------------ |
| 上傳回應時間   | < 2 秒（10MB 以內）        | 不含網路傳輸時間               |
| 下載回應時間   | < 500ms（啟動傳輸）        | 使用串流傳輸，即時開始         |
| 列表查詢時間   | < 300ms                    | 一般查詢操作                   |
| 並發上傳       | 支援 50+ 並發請求          | 依伺服器資源調整               |
| 大檔案支援     | 支援 100MB+ 檔案           | 建議實作分塊上傳               |
| 儲存空間       | 依配額管理                 | 監控磁碟/雲端儲存使用量        |

### 10.2 可用性需求

| 項目         | 需求                   | 說明                           |
| ------------ | ---------------------- | ------------------------------ |
| 系統可用性   | 99.9%                  | 年停機時間不超過 8.76 小時     |
| 資料持久性   | 99.999%                | 雲端儲存提供高持久性           |
| 備份策略     | 每日備份               | 本地儲存需定期備份             |
| 災難復原     | RTO < 4 小時           | 復原時間目標                   |
| 錯誤處理     | 完整的錯誤訊息         | 協助使用者理解問題             |

### 10.3 安全性需求

| 項目         | 需求                   | 說明                           |
| ------------ | ---------------------- | ------------------------------ |
| 身份認證     | JWT Token              | 所有 API 需要有效的 Token      |
| 檔案驗證     | MIME type 驗證         | 防止惡意檔案上傳               |
| 路徑安全     | UUID 檔名              | 防止路徑遍歷攻擊               |
| 檔案掃描     | 病毒掃描（建議）       | 整合防毒軟體 API               |
| 存取控制     | 權限檢查（建議）       | 確保使用者只能存取授權檔案     |
| HTTPS        | 強制使用 HTTPS         | 加密傳輸資料                   |
| 資料加密     | 雲端儲存加密           | GCS 提供加密儲存               |

### 10.4 可擴展性需求

| 項目         | 需求                   | 說明                           |
| ------------ | ---------------------- | ------------------------------ |
| 水平擴展     | 支援多實例部署         | 無狀態設計                     |
| 儲存擴展     | 支援多種儲存驅動       | Strategy Pattern 易於擴展      |
| CDN 整合     | 支援 CDN 加速（建議）  | 提升下載速度                   |
| 快取策略     | 檔案元資料快取         | 減少資料庫查詢                 |
| 負載均衡     | 支援多伺服器負載均衡   | 分散上傳/下載負載              |

### 10.5 可維護性需求

| 項目         | 需求                   | 說明                           |
| ------------ | ---------------------- | ------------------------------ |
| 程式碼規範   | 遵循專案 Code Style    | 保持程式碼一致性               |
| API 文件     | Swagger 自動生成       | 便於前端開發和測試             |
| 日誌記錄     | 記錄所有檔案操作       | 上傳、下載、刪除等             |
| 監控告警     | 儲存空間、錯誤率監控   | 即時掌握系統狀態               |
| 單元測試     | 測試覆蓋率 > 80%       | 確保程式碼品質                 |

### 10.6 相容性需求

| 項目         | 需求                   | 說明                           |
| ------------ | ---------------------- | ------------------------------ |
| 檔案格式     | 支援常見格式           | 圖片、文件、影音等             |
| 瀏覽器支援   | Chrome, Firefox, Safari| 主流瀏覽器最新兩個版本         |
| 行動裝置     | 支援行動裝置上傳       | 響應式設計                     |
| 中文檔名     | 完整支援中文檔名       | UTF-8 編碼                     |

### 10.7 儲存空間管理

| 項目         | 需求                   | 說明                           |
| ------------ | ---------------------- | ------------------------------ |
| 配額限制     | 使用者/專案配額        | 防止濫用                       |
| 空間監控     | 即時顯示使用量         | 儀表板顯示                     |
| 清理策略     | 定期清理過期檔案       | 軟刪除檔案物理刪除             |
| 大小限制     | 單檔 100MB             | 依需求調整                     |
| 格式限制     | 黑名單/白名單（可選）  | 限制可上傳的檔案類型           |

---

## 版本歷史

| 版本 | 日期       | 說明                                             | 作者  |
| ---- | ---------- | ------------------------------------------------ | ----- |
| v1.0 | 2025-11-17 | 初版發布，基於現有程式碼分析撰寫系統分析文件     | Claude |

---

**© 2025 Sys Public Property API Documentation Team. All rights reserved.**
