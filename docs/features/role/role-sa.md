# 角色管理模組 - 系統分析文件（SA）

> **版本：** v1.0
> **更新日期：** 2025-01-17
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
- [9. 非功能性需求](#9-非功能性需求)
- [10. 版本歷史](#10-版本歷史)

---

## 1. 概述

角色管理模組（Role Module）提供完整的 RBAC（Role-Based Access Control）基於角色的存取控制功能，用於管理系統中的角色、權限配置，以及使用者與角色的關聯關係。

本模組是系統安全架構的核心組件，確保系統資源能夠根據使用者的角色進行適當的存取控制。

---

## 2. 功能概述

### 2.1 核心功能

本模組提供以下核心功能：

- ✅ **角色管理**：建立、查詢、修改、刪除系統角色
- ✅ **權限配置**：為角色分配功能權限
- ✅ **使用者角色關聯**：設定使用者擁有的角色
- ✅ **權限查詢**：查詢角色或使用者擁有的權限
- ✅ **權限驗證**：檢查角色或使用者是否具備特定權限
- ✅ **軟刪除機制**：支援角色的軟刪除與資料保護

### 2.2 業務價值

- **集中化權限管理**：統一管理系統所有功能的存取權限
- **靈活的角色配置**：支援多角色、多權限的組合配置
- **安全性保障**：確保系統資源僅能被授權使用者存取
- **可追溯性**：完整記錄角色變更歷史

---

## 3. 使用情境範例

### 3.1 情境一：系統管理員建立新角色

**流程說明：** 系統管理員建立一個新的角色，並為其配置相應的功能權限。

**使用場景：**

1. **新進員工職位設定**：為新的職位類型建立對應的角色
2. **組織架構調整**：因應組織變更，建立新的職能角色
3. **專案團隊設定**：為特定專案建立專屬的角色權限
4. **測試環境設定**：建立測試用角色進行功能驗證

**前置條件：**

- 使用者已登入系統
- 使用者擁有 `ROLE__CREATE` 權限

**事件流程：**

```
管理員操作
  │
  ├─> 開啟角色管理頁面
  │
  ├─> 點擊「建立新角色」按鈕
  │
  ├─> 填寫角色資訊
  │   ├─> 角色名稱：「財務主管」
  │   ├─> 啟用狀態：true
  │   └─> 選擇權限
  │       ├─> USER__VIEW（檢視使用者）
  │       ├─> USER__UPDATE（更新使用者）
  │       └─> ROLE__VIEW（檢視角色）
  │
  ├─> 提交表單
  │   └─> POST /role
  │
  ├─> 伺服器處理
  │   ├─> 驗證欄位格式
  │   ├─> 檢查權限陣列不重複
  │   ├─> 建立角色資料
  │   └─> 建立角色權限關聯
  │
  ├─> 成功回應
  │   └─> 返回新建立的角色資料（包含權限列表）
  │
  └─> 顯示成功訊息並更新角色列表
```

---

### 3.2 情境二：查詢角色列表

**流程說明：** 管理員查詢系統中所有角色的列表，支援分頁瀏覽。

**使用場景：**

1. **角色總覽**：檢視系統中所有已建立的角色
2. **尋找特定角色**：在角色列表中搜尋目標角色
3. **權限審查**：檢視各角色的權限配置狀況
4. **使用狀況查詢**：了解各角色被分配的使用者數量

**事件流程：**

```
管理員操作
  │
  ├─> GET /role?page=1&limit=20
  │
  ├─> 伺服器處理
  │   ├─> 查詢 Role 資料（過濾已軟刪除）
  │   ├─> 載入關聯資料
  │   │   ├─> roleHasPermission（權限列表）
  │   │   └─> userAccountHasRole（使用者關聯）
  │   ├─> 計算使用者數量
  │   └─> 分頁處理
  │
  ├─> 回傳資料
  │   ├─> data: 角色陣列
  │   └─> meta: 分頁資訊（總筆數、總頁數等）
  │
  └─> 顯示角色列表
      ├─> 角色名稱
      ├─> 啟用狀態
      ├─> 權限列表
      └─> 使用者數量
```

---

### 3.3 情境三：修改角色權限

**流程說明：** 管理員修改現有角色的權限配置，變更會立即影響所有擁有該角色的使用者。

**使用場景：**

1. **權限擴充**：因應業務需求，為角色增加新權限
2. **權限縮減**：基於安全考量，移除某些權限
3. **職能調整**：因組織變更，重新配置角色權限
4. **安全事件處理**：緊急調整權限以因應安全問題

**事件流程：**

```
管理員操作
  │
  ├─> GET /role/:id（查詢角色詳情）
  │   └─> 顯示當前權限配置
  │
  ├─> 修改權限設定
  │   ├─> 取消勾選：USER__DELETE
  │   └─> 新增勾選：ROLE__UPDATE
  │
  ├─> 提交變更
  │   └─> PATCH /role/:id
  │
  ├─> 伺服器處理
  │   ├─> 檢查角色是否存在
  │   ├─> 驗證權限陣列
  │   ├─> 刪除所有舊的權限關聯
  │   │   └─> DELETE FROM role_has_permission WHERE role_id = :id
  │   ├─> 建立新的權限關聯
  │   │   └─> INSERT INTO role_has_permission
  │   └─> 更新角色基本資料
  │
  ├─> 成功回應
  │   └─> 返回更新後的角色資料
  │
  └─> 顯示更新成功訊息
```

**實作重點：**

- 權限更新採用「先刪除後建立」策略，確保資料一致性
- 變更立即生效，影響所有擁有該角色的使用者
- 使用交易確保資料完整性

---

### 3.4 情境四：刪除角色

**流程說明：** 管理員刪除不再使用的角色，系統會檢查該角色是否仍被使用者使用。

**使用場景：**

1. **清理過時角色**：移除已不再使用的職位角色
2. **測試資料清理**：刪除測試環境建立的角色
3. **組織簡化**：精簡角色結構，刪除冗餘角色

**事件流程：**

```
管理員操作
  │
  ├─> 選擇要刪除的角色
  │
  ├─> 點擊「刪除」按鈕
  │
  ├─> 確認刪除對話框
  │   └─> 點擊「確認」
  │
  ├─> DELETE /role/:id
  │
  ├─> 伺服器處理
  │   ├─> 檢查角色是否存在
  │   │
  │   ├─> 檢查是否有使用者使用此角色
  │   │   └─> SELECT COUNT(*) FROM user_account_has_role WHERE role_id = :id
  │   │
  │   ├─> 如果有使用者使用：
  │   │   ├─> 拋出錯誤
  │   │   └─> 錯誤訊息：「此角色已被設定，無法刪除」
  │   │
  │   └─> 如果無使用者使用：
  │       ├─> 執行軟刪除
  │       └─> UPDATE role SET deleted_at = NOW() WHERE id = :id
  │
  ├─> 成功情況：
  │   ├─> 返回 204 No Content
  │   └─> 顯示刪除成功訊息
  │
  └─> 失敗情況：
      ├─> 返回 400 Bad Request
      └─> 顯示錯誤訊息
```

**業務規則：**

- 只有未被任何使用者使用的角色才能刪除
- 使用軟刪除機制，資料不會真正從資料庫移除
- 已刪除的角色不會出現在查詢結果中

---

### 3.5 情境五：為使用者分配角色

**流程說明：** 管理員為特定使用者分配一個或多個角色。

**使用場景：**

1. **新進員工設定**：為新進員工分配職位對應的角色
2. **職務調動**：員工職務變更時調整角色配置
3. **權限調整**：根據工作需求增減使用者角色
4. **臨時授權**：為特定任務臨時分配額外角色

**事件流程：**

```
管理員操作
  │
  ├─> 開啟使用者詳情頁面
  │
  ├─> 點擊「編輯角色」
  │
  ├─> 選擇角色
  │   ├─> 勾選：「財務主管」
  │   ├─> 勾選：「一般員工」
  │   └─> 取消勾選之前的角色
  │
  ├─> 提交變更
  │   └─> PATCH /user-account/:id/role（此為使用者帳號模組提供的端點）
  │       或透過 UserRoleService.updateRole()
  │
  ├─> 伺服器處理
  │   ├─> 驗證使用者帳號存在
  │   ├─> 刪除該使用者的所有角色關聯
  │   │   └─> DELETE FROM user_account_has_role WHERE user_account_id = :id
  │   ├─> 建立新的角色關聯
  │   │   └─> INSERT INTO user_account_has_role
  │   └─> 更新使用者資料
  │
  └─> 顯示更新成功訊息
```

**實作重點：**

- 支援一個使用者擁有多個角色
- 使用者的最終權限是所有角色權限的聯集
- 角色變更立即生效

---

### 3.6 情境六：查詢可用權限清單

**流程說明：** 前端應用程式查詢系統中所有可用的權限項目，用於角色編輯介面的權限選擇。

**使用場景：**

1. **建立角色介面**：顯示所有可選擇的權限項目
2. **編輯角色介面**：展示權限勾選清單
3. **權限說明文件**：產生系統權限清單文件

**事件流程：**

```
前端應用程式
  │
  ├─> GET /role/action/get-role-permission
  │
  ├─> 伺服器處理
  │   ├─> 讀取 PermissionSetList 配置
  │   ├─> 組織權限結構
  │   │   ├─> action: 動作類型列表（VIEW, CREATE, UPDATE, DELETE）
  │   │   └─> menu: 功能模組與權限對應
  │   │       ├─> featureName: 功能名稱（如 "USER"）
  │   │       ├─> displayName: 顯示名稱（如 "使用者管理"）
  │   │       └─> permission: 該功能的權限列表
  │   └─> 驗證權限設定一致性
  │
  ├─> 回傳權限結構
  │   {
  │     action: [
  │       { name: "VIEW", displayName: "檢視" },
  │       { name: "CREATE", displayName: "建立" },
  │       ...
  │     ],
  │     menu: [
  │       {
  │         featureName: "USER",
  │         displayName: "使用者管理",
  │         permission: [
  │           { action: "VIEW", displayName: "檢視", name: "USER__VIEW" },
  │           ...
  │         ]
  │       },
  │       ...
  │     ]
  │   }
  │
  └─> 前端渲染權限選擇介面
      └─> 以功能模組分組顯示權限勾選框
```

---

## 4. 系統流程圖

### 4.1 角色建立流程圖

```
管理員建立新角色
  │
  ├─> 驗證權限（ROLE__CREATE）
  │   ├─> 通過：繼續
  │   └─> 未通過：返回 403 Forbidden
  │
  ├─> 驗證請求資料
  │   ├─> 驗證角色名稱（必填、字串）
  │   ├─> 驗證啟用狀態（布林值）
  │   └─> 驗證權限陣列
  │       ├─> 必填
  │       ├─> 每個權限必須是有效的 Permission enum
  │       └─> 不可重複
  │
  ├─> 建立角色資料
  │   ├─> INSERT INTO role (name, is_enabled)
  │   └─> 返回角色 ID
  │
  ├─> 建立權限關聯
  │   └─> INSERT INTO role_has_permission (role_id, permission)
  │       └─> 批次插入所有權限
  │
  ├─> 查詢完整資料
  │   ├─> 載入 roleHasPermission
  │   └─> 載入 userAccountHasRole
  │
  ├─> 轉換為 RoleEntity
  │   ├─> 計算 userCount
  │   └─> 轉換 permission 格式
  │
  └─> 返回 200 OK + 角色資料
```

---

### 4.2 角色更新流程圖

```
管理員更新角色
  │
  ├─> 驗證權限（ROLE__UPDATE）
  │
  ├─> 檢查角色是否存在
  │   ├─> existsOrThrow({ id, deletedAt: null })
  │   ├─> 存在：繼續
  │   └─> 不存在：返回 404 Not Found
  │
  ├─> 驗證請求資料
  │   ├─> 角色名稱（可選、字串）
  │   ├─> 啟用狀態（可選、布林值）
  │   └─> 權限陣列（可選、不可重複）
  │
  ├─> 更新角色基本資料
  │   └─> UPDATE role SET name = ?, is_enabled = ?
  │
  ├─> 如果提供權限列表：
  │   ├─> 刪除所有舊權限
  │   │   └─> DELETE FROM role_has_permission WHERE role_id = ?
  │   └─> 建立新權限關聯
  │       └─> INSERT INTO role_has_permission
  │
  ├─> 查詢更新後的完整資料
  │
  └─> 返回 200 OK + 更新後的角色資料
```

---

### 4.3 角色刪除流程圖

```
管理員刪除角色
  │
  ├─> 驗證權限（ROLE__DELETE）
  │
  ├─> 檢查角色是否存在
  │   ├─> existsOrThrow({ id, deletedAt: null })
  │   └─> 不存在：返回 404 Not Found
  │
  ├─> 檢查是否有使用者使用此角色
  │   ├─> SELECT * FROM role WHERE id = ? AND EXISTS (
  │   │     SELECT 1 FROM user_account_has_role WHERE role_id = ?
  │   │   )
  │   │
  │   ├─> 有使用者使用：
  │   │   ├─> 拋出錯誤
  │   │   └─> 返回 400 Bad Request
  │   │       └─> 錯誤訊息：「此角色已被設定，無法刪除」
  │   │
  │   └─> 無使用者使用：繼續刪除
  │
  ├─> 執行軟刪除
  │   └─> UPDATE role SET deleted_at = NOW() WHERE id = ?
  │
  └─> 返回 204 No Content
```

---

### 4.4 使用者角色設定流程圖

```
管理員為使用者設定角色
  │
  ├─> 驗證使用者帳號存在
  │   ├─> userAccountService.findOne(userAccountId)
  │   └─> 不存在：拋出 404 錯誤
  │
  ├─> 刪除該使用者的所有角色關聯
  │   └─> DELETE FROM user_account_has_role
  │       WHERE user_account_id = ?
  │
  ├─> 建立新的角色關聯
  │   └─> INSERT INTO user_account_has_role
  │       (user_account_id, role_id)
  │       VALUES (?, ?), (?, ?), ...
  │
  ├─> 更新使用者資料
  │   └─> 載入最新的角色關聯資料
  │
  └─> 返回更新後的使用者資料
```

---

## 5. 時序圖

### 5.1 建立角色時序圖

```
[管理員]    [前端應用]    [API Gateway]    [RoleController]    [RoleService]    [PrismaService]    [資料庫]
   │             │               │                  │                 │                  │              │
   ├─ 填寫表單 ──>│               │                  │                 │                  │              │
   │             ├─ POST /role ──>│                  │                 │                  │              │
   │             │               ├─ 驗證權限 ────────>│                 │                  │              │
   │             │               │                  ├─ create(dto) ───>│                  │              │
   │             │               │                  │                 ├─ role.create() ─>│              │
   │             │               │                  │                 │                  ├─ INSERT ────>│
   │             │               │                  │                 │                  │<─ 角色ID ────┤
   │             │               │                  │                 │                  ├─ INSERT ────>│
   │             │               │                  │                 │                  │  (權限關聯)  │
   │             │               │                  │                 │<─ 完整資料 ──────┤              │
   │             │               │                  │<─ RoleEntity ───┤                  │              │
   │             │<─ 200 OK ─────┤                  │                 │                  │              │
   │<─ 顯示成功 ──┤               │                  │                 │                  │              │
   │             │               │                  │                 │                  │              │
```

---

### 5.2 修改角色權限時序圖

```
[管理員]    [前端應用]    [RoleController]    [RoleService]    [PrismaService]    [資料庫]
   │             │               │                  │                  │              │
   ├─ 修改權限 ──>│               │                  │                  │              │
   │             ├─ PATCH /role/:id ──────────────>│                  │              │
   │             │               ├─ existsOrThrow()─>│                  │              │
   │             │               │                  ├─ role.exists() ─>│              │
   │             │               │                  │                  ├─ SELECT ────>│
   │             │               │                  │                  │<─ 存在 ───────┤
   │             │               │                  │<─ true ──────────┤              │
   │             │               │                  │                  │              │
   │             │               ├─ update() ───────>│                  │              │
   │             │               │                  ├─ role.update() ─>│              │
   │             │               │                  │                  ├─ DELETE ────>│
   │             │               │                  │                  │  (舊權限)    │
   │             │               │                  │                  ├─ INSERT ────>│
   │             │               │                  │                  │  (新權限)    │
   │             │               │                  │                  ├─ UPDATE ────>│
   │             │               │                  │                  │  (基本資料)  │
   │             │               │                  │<─ 更新後資料 ────┤              │
   │             │<─ 200 OK ─────┤                  │                  │              │
   │<─ 顯示成功 ──┤               │                  │                  │              │
   │             │               │                  │                  │              │
```

---

### 5.3 刪除角色（失敗情況）時序圖

```
[管理員]    [前端應用]    [RoleController]    [RoleService]    [PrismaService]    [資料庫]
   │             │               │                  │                  │              │
   ├─ 刪除角色 ──>│               │                  │                  │              │
   │             ├─ DELETE /role/:id ──────────────>│                  │              │
   │             │               ├─ existsOrThrow()─>│                  │              │
   │             │               │                  │ (檢查存在)        │              │
   │             │               │                  │                  │              │
   │             │               ├─ softDelete() ───>│                  │              │
   │             │               │                  ├─ hasUser() ──────>│              │
   │             │               │                  │                  ├─ SELECT ────>│
   │             │               │                  │                  │  (檢查使用者)│
   │             │               │                  │                  │<─ 有使用者 ──┤
   │             │               │                  │<─ true ──────────┤              │
   │             │               │                  │                  │              │
   │             │               │                  ├─ abort() ────────>│              │
   │             │               │                  │  (拋出錯誤)       │              │
   │             │<─ 400 Bad Request ──────────────┤                  │              │
   │             │   「此角色已被設定，無法刪除」     │                  │              │
   │<─ 顯示錯誤 ──┤               │                  │                  │              │
   │             │               │                  │                  │              │
```

---

## 6. 事件流程說明

### 6.1 角色建立事件流程

**步驟 1：前端驗證**
- 驗證角色名稱不為空
- 驗證至少選擇一個權限
- 驗證權限不重複

**步驟 2：發送 API 請求**
```
POST /role
Content-Type: application/json

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

**步驟 3：後端驗證**
- 使用 class-validator 驗證 DTO
- `@IsNotEmpty()` 驗證必填欄位
- `@IsEnum(Permission)` 驗證權限有效性
- `@ArrayObjDistinct('name')` 驗證權限不重複

**步驟 4：資料庫操作**
```sql
-- 4.1 建立角色
INSERT INTO role (name, is_enabled, created_at, updated_at)
VALUES ('財務主管', true, NOW(), NOW())
RETURNING id;

-- 4.2 建立權限關聯（批次插入）
INSERT INTO role_has_permission (role_id, permission, created_at, updated_at)
VALUES
  (1, 'USER__VIEW', NOW(), NOW()),
  (1, 'USER__UPDATE', NOW(), NOW()),
  (1, 'ROLE__VIEW', NOW(), NOW());
```

**步驟 5：回傳結果**
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

---

### 6.2 角色刪除事件流程（含業務規則檢查）

**步驟 1：存在性檢查**
```sql
SELECT id FROM role
WHERE id = ? AND deleted_at IS NULL;
```
- 若不存在：返回 404 Not Found

**步驟 2：使用狀態檢查**
```sql
SELECT id FROM role
WHERE id = ?
AND EXISTS (
  SELECT 1 FROM user_account_has_role
  WHERE role_id = ?
);
```
- 若有使用者使用：拋出 400 錯誤「此角色已被設定，無法刪除」

**步驟 3：執行軟刪除**
```sql
UPDATE role
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = ?;
```

**步驟 4：回傳結果**
- 成功：204 No Content（無回傳內容）
- 失敗：400 Bad Request + 錯誤訊息

---

## 7. 業務規則與限制

### 7.1 角色管理規則

#### 7.1.1 角色名稱規則
- ✅ 必填欄位，不可為空
- ✅ 必須為字串型態
- ❌ 目前未強制唯一性（可考慮未來加入）

#### 7.1.2 角色啟用狀態
- ✅ 預設值為 `true`（啟用）
- ✅ 可建立停用的角色（`isEnabled: false`）
- ⚠️ 停用的角色仍可查詢，但建議前端過濾或標示

#### 7.1.3 角色刪除限制
- **嚴格限制**：只有未被任何使用者使用的角色才能刪除
- **檢查機制**：`hasUser()` 方法檢查 `user_account_has_role` 表
- **錯誤處理**：若有使用者使用，拋出 400 錯誤
- **建議流程**：刪除前先將使用者轉移到其他角色

---

### 7.2 權限配置規則

#### 7.2.1 權限陣列規則
- ✅ 建立角色時必須提供至少一個權限
- ✅ 權限名稱必須符合 `Permission` enum 定義
- ✅ 權限陣列不可包含重複項目（`@ArrayObjDistinct` 驗證）
- ✅ 更新角色時權限為可選欄位

#### 7.2.2 權限更新機制
- **策略**：先刪除所有舊權限，再建立新權限
- **原因**：確保權限資料完全同步，避免遺留無效權限
- **風險**：若建立失敗，角色會暫時無權限（建議使用交易）

#### 7.2.3 權限有效性
- ✅ 所有權限必須在 `Permission` enum 中定義
- ✅ 系統啟動時會驗證 `PermissionSetList` 與 `Permission` 的一致性
- ❌ 不支援動態權限（需修改程式碼）

---

### 7.3 使用者角色關聯規則

#### 7.3.1 多角色支援
- ✅ 一個使用者可以擁有多個角色
- ✅ 使用者的有效權限為所有角色權限的聯集
- ✅ 權限計算包含直接權限和角色權限

#### 7.3.2 角色變更影響
- **即時生效**：角色權限變更會立即影響所有擁有該角色的使用者
- **無需重新登入**：權限檢查時動態查詢最新權限
- **風險控管**：重大權限變更前應通知受影響使用者

#### 7.3.3 角色移除規則
- ✅ 使用「先刪除後建立」策略更新使用者角色
- ✅ 可一次設定多個角色
- ⚠️ 若設定空陣列，使用者將失去所有角色（需前端確認）

---

### 7.4 資料完整性規則

#### 7.4.1 軟刪除機制
- ✅ 所有查詢都必須過濾 `deleted_at IS NULL`
- ✅ 已刪除的角色不會出現在列表中
- ✅ 已刪除的角色無法再被使用者關聯
- ✅ 保留歷史資料供稽核使用

#### 7.4.2 外鍵關聯
- `RoleHasPermission.roleId` → `Role.id`（無級聯刪除）
- `UserAccountHasRole.roleId` → `Role.id`（Cascade Delete）
- `UserAccountHasRole.userAccountId` → `UserAccount.id`（Cascade Delete）

#### 7.4.3 複合主鍵
- `RoleHasPermission`：`(roleId, permission)`
- `UserAccountHasRole`：`(userAccountId, roleId)`
- **優點**：確保不會重複建立相同的關聯
- **限制**：無獨立的 ID 欄位

---

## 8. 資料流向

### 8.1 角色建立資料流

```
前端表單
  │
  ├─> CreateRoleDto
  │   ├─> name: string
  │   ├─> isEnabled?: boolean
  │   └─> permission: PermissionDto[]
  │       └─> name: Permission
  │
  ├─> RoleController.create()
  │   └─> 接收並驗證 DTO
  │
  ├─> RoleService.create()
  │   ├─> 組織 Prisma.RoleCreateInput
  │   │   ├─> name
  │   │   ├─> isEnabled
  │   │   └─> roleHasPermission.create (巢狀建立)
  │   └─> 呼叫 prisma.role.create()
  │
  ├─> 資料庫
  │   ├─> INSERT INTO role
  │   └─> INSERT INTO role_has_permission (批次)
  │
  ├─> 回傳 Prisma 原始資料
  │   ├─> role (基本資料)
  │   ├─> roleHasPermission[] (權限關聯)
  │   └─> userAccountHasRole[] (使用者關聯)
  │
  ├─> plainToInstance(RoleEntity)
  │   ├─> 轉換為 Entity 格式
  │   ├─> 計算 permission()
  │   └─> 計算 userCount()
  │
  └─> 回傳給前端
      └─> RoleEntity JSON
```

---

### 8.2 權限查詢資料流

```
使用者請求
  │
  ├─> PermissionService.getByUser(userAccountId)
  │
  ├─> 查詢使用者資料
  │   └─> prisma.userAccount.findMany({
  │         include: {
  │           userAccountHasPermission: true,
  │           userAccountHasRole: {
  │             include: {
  │               role: { include: { roleHasPermission: true } }
  │             }
  │           }
  │         }
  │       })
  │
  ├─> 提取權限
  │   ├─> 直接權限：userAccountHasPermission[].permission
  │   └─> 角色權限：userAccountHasRole[].role.roleHasPermission[].permission
  │
  ├─> 合併並去重
  │   └─> uniq([...直接權限, ...角色權限])
  │
  └─> 回傳 Permission[]
      └─> ["USER__VIEW", "USER__CREATE", "ROLE__VIEW", ...]
```

---

### 8.3 權限驗證資料流

```
API 請求
  │
  ├─> 權限檢查中介層 (Guard/Middleware)
  │
  ├─> PermissionService.checkByUser(userId, needPermission)
  │
  ├─> 取得使用者權限
  │   └─> getByUser(userId)
  │       └─> 返回 Permission[]
  │
  ├─> 比對所需權限
  │   └─> checkPermission(hasPermission, needPermission)
  │       ├─> 檢查每個所需權限是否在擁有權限中
  │       └─> 若有缺少的權限，記錄到 lackPermission[]
  │
  ├─> 驗證結果
  │   ├─> 若 lackPermission.length > 0：
  │   │   └─> abort(`權限不足，缺少${lackPermission.join(',')}權限`)
  │   │       └─> 拋出 400 Bad Request
  │   └─> 若權限足夠：
  │       └─> 繼續執行 API 請求
  │
  └─> 處理結果
      ├─> 成功：執行業務邏輯並回傳結果
      └─> 失敗：回傳權限不足錯誤
```

---

## 9. 非功能性需求

### 9.1 效能需求

#### 9.1.1 回應時間
- **角色查詢（單筆）**：< 100ms
- **角色列表查詢（分頁）**：< 300ms
- **角色建立/更新**：< 500ms
- **權限驗證**：< 50ms（高頻操作，需快速回應）

#### 9.1.2 並發處理
- 支援多使用者同時操作角色管理
- 使用資料庫交易確保資料一致性
- 避免角色權限更新時的競爭條件

#### 9.1.3 快取策略（建議）
- 考慮快取使用者權限列表（減少資料庫查詢）
- 權限變更時清除相關快取
- 使用 Redis 或記憶體快取

---

### 9.2 安全性需求

#### 9.2.1 存取控制
- 所有角色管理 API 都需要對應的權限
- 建立角色：需要 `ROLE__CREATE` 權限
- 查詢角色：需要 `ROLE__VIEW` 權限
- 修改角色：需要 `ROLE__UPDATE` 權限
- 刪除角色：需要 `ROLE__DELETE` 權限

#### 9.2.2 資料驗證
- 後端必須完整驗證所有輸入資料
- 使用 class-validator 進行 DTO 驗證
- 防止 SQL Injection（使用 Prisma ORM）
- 防止 XSS 攻擊（前端需對角色名稱進行跳脫）

#### 9.2.3 稽核日誌（建議）
- 記錄所有角色的建立、修改、刪除操作
- 記錄操作者、操作時間、變更內容
- 定期檢視權限變更歷史

---

### 9.3 可用性需求

#### 9.3.1 錯誤處理
- 提供清晰的錯誤訊息
- 區分不同類型的錯誤（404、400、403、500）
- 前端需友善呈現錯誤訊息

#### 9.3.2 使用者體驗
- 角色列表支援分頁，避免一次載入過多資料
- 提供角色使用者數量資訊，協助管理員決策
- 刪除前顯示確認對話框
- 刪除失敗時提示原因（角色仍被使用）

---

### 9.4 可維護性需求

#### 9.4.1 程式碼品質
- 遵循專案的程式碼風格規範
- Service 層專注業務邏輯
- Controller 層僅處理 HTTP 請求/回應
- 使用 TypeScript 型別確保型別安全

#### 9.4.2 測試需求
- 單元測試：覆蓋 Service 層的所有方法
- 整合測試：測試 API 端點的完整流程
- 測試角色刪除的業務規則（有使用者/無使用者）

---

### 9.5 擴展性需求

#### 9.5.1 權限系統擴展
- 新增權限時，只需修改 `Permission` enum
- 更新 `PermissionSetList` 配置
- 系統會自動驗證權限定義的一致性

#### 9.5.2 功能擴展建議
- **角色繼承**：支援角色間的繼承關係
- **時效性權限**：支援權限的有效期限
- **條件式權限**：根據條件動態授予權限
- **權限範圍**：支援資料層級的權限控制

---

## 10. 版本歷史

| 版本 | 日期       | 說明             | 作者          |
| ---- | ---------- | ---------------- | ------------- |
| v1.0 | 2025-01-17 | 初版發布         | Claude Code   |

---

**© 2025 Sys Public Property API Documentation Team. All rights reserved.**
