# 後台使用者管理系統分析文件 (SA)

> **版本：** v1.0
> **更新日期：** 2025-01-17
> **文件類型：** 系統分析與流程設計文件

---

## 📋 目錄

- [1. 概述](#1-概述)
- [2. 功能範圍](#2-功能範圍)
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

### 1.1 功能簡介

後台使用者管理系統提供完整的使用者生命週期管理、身份驗證、權限控制等核心功能。本系統支援傳統帳號密碼登入、第三方登入(Google/Line)、以及完善的忘記密碼流程。

### 1.2 核心特性

- ✅ **使用者生命週期管理**：提供使用者的建立、查詢、更新、刪除等完整 CRUD 操作
- ✅ **多元認證方式**：支援帳號密碼登入、Google 登入、Line 登入
- ✅ **安全的註冊流程**：註冊後需透過 Email 驗證碼驗證才能啟用帳號
- ✅ **完整的忘記密碼流程**：支援透過 Email 或 SMS 接收驗證碼重置密碼
- ✅ **JWT Token 認證**：使用 JWT Token 進行身份驗證,支援 Token 刷新機制
- ✅ **角色權限管理**：透過角色(Role)和權限(Permission)進行精細的存取控制
- ✅ **超級管理員機制**：支援超級管理員(isRoot)擁有所有權限
- ✅ **軟刪除機制**：刪除使用者採用軟刪除,保留資料追蹤能力

### 1.3 系統架構層級

```
使用者介面層
    ↓
API 控制器層 (UserController, UserAuthController)
    ↓
業務邏輯層 (UserService, UserAuthService, VerifyTokenService)
    ↓
資料存取層 (PrismaService)
    ↓
資料庫層 (PostgreSQL)
```

---

## 2. 功能範圍

### 2.1 使用者管理功能

| 功能編號 | 功能名稱         | 說明                                     |
| -------- | ---------------- | ---------------------------------------- |
| UM-001   | 建立後台使用者   | 管理員建立新的後台使用者並指派角色       |
| UM-002   | 建立超級管理員   | 建立擁有所有權限的超級管理員帳號         |
| UM-003   | 查詢使用者列表   | 查詢所有使用者,支援關鍵字搜尋、角色篩選 |
| UM-004   | 查詢使用者詳情   | 查詢單一使用者的詳細資訊                 |
| UM-005   | 更新使用者資料   | 更新使用者的基本資料和角色               |
| UM-006   | 刪除使用者       | 軟刪除使用者帳號                         |
| UM-007   | 重置使用者密碼   | 管理員重置指定使用者的密碼               |
| UM-008   | 驗證使用者權限   | 檢查使用者是否擁有指定的權限             |

### 2.2 認證與授權功能

| 功能編號 | 功能名稱           | 說明                                   |
| -------- | ------------------ | -------------------------------------- |
| AUTH-001 | 使用者註冊         | 使用者註冊帳號並接收 Email 驗證碼      |
| AUTH-002 | 驗證註冊驗證碼     | 驗證 Email 驗證碼並啟用帳號            |
| AUTH-003 | 重新發送註冊驗證碼 | 重新發送註冊驗證碼                     |
| AUTH-004 | 使用者登入         | 使用帳號密碼登入系統                   |
| AUTH-005 | 第三方登入         | 使用 Google 或 Line 帳號登入           |
| AUTH-006 | 取得個人資料       | 取得當前登入使用者的個人資料           |
| AUTH-007 | 更新個人資料       | 更新當前登入使用者的個人資料           |
| AUTH-008 | 更新密碼           | 使用者更新自己的密碼                   |
| AUTH-009 | 驗證 Token         | 驗證 JWT Token 是否有效                |
| AUTH-010 | 刷新 Token         | 使用 Refresh Token 機制刷新 JWT Token  |
| AUTH-011 | 忘記密碼           | 透過 Email 或 SMS 接收驗證碼重置密碼   |
| AUTH-012 | 取得使用者權限     | 取得當前登入使用者的角色和權限列表     |

---

## 3. 使用情境範例

### 3.1 情境一：管理員建立後台使用者

**流程說明：** 系統管理員透過管理介面建立新的後台使用者,並指派角色。

**事件流程：**

```
管理員登入系統
  │
  ├─> 進入使用者管理頁面
  │
  ├─> 點擊「新增使用者」按鈕
  │
  ├─> 填寫使用者資料
  │   ├─> 帳號 (必填)
  │   ├─> 密碼 (必填)
  │   ├─> 姓名 (必填)
  │   ├─> 手機 (選填)
  │   ├─> Email (選填)
  │   ├─> 是否啟用 (預設: true)
  │   └─> 指派角色 (必填)
  │
  ├─> POST /user
  │   {
  │     "account": "admin001",
  │     "password": "password123",
  │     "name": "管理員",
  │     "phone": "0912345678",
  │     "email": "admin@example.com",
  │     "isEnabled": true,
  │     "role": { "id": 1 }
  │   }
  │
  ├─> [Server] 驗證角色是否存在
  │
  ├─> [Server] 檢查帳號是否重複
  │
  ├─> [Server] 建立 UserAccount
  │
  ├─> [Server] 建立 User
  │
  ├─> [Server] 關聯角色 (UserAccountHasRole)
  │
  └─> 返回建立成功的使用者資料
```

**使用場景：**

1. **新員工入職**：HR 為新入職的員工建立後台帳號
2. **角色調整**：管理員為使用者指派新的角色
3. **臨時帳號**：為外部稽核人員建立臨時帳號

**實作重點：**

- 先驗證角色是否存在,再建立使用者
- 使用 Transaction 確保 UserAccount、User、UserAccountHasRole 建立的原子性
- 帳號預設為啟用狀態 (isEnabled=true, isValid=true)
- 密碼需經過加密後儲存

---

### 3.2 情境二：使用者註冊與驗證

**流程說明：** 新使用者註冊帳號,接收 Email 驗證碼,完成驗證後啟用帳號。

**事件流程：**

```
使用者訪問註冊頁面
  │
  ├─> 填寫註冊資料
  │   ├─> 帳號 (必填)
  │   ├─> 密碼 (必填)
  │   ├─> 姓名 (必填)
  │   ├─> 手機 (必填)
  │   └─> Email (必填)
  │
  ├─> POST /user-auth/register
  │
  ├─> [Server] 檢查帳號是否已存在
  │
  ├─> [Server] 建立 UserAccount (帳號資料)
  │
  ├─> [Server] 建立 User (isValid=false, isEnabled=true)
  │
  ├─> [Server] 建立 VerifyToken (type=REGISTER)
  │
  ├─> [Server] 生成 6 位數驗證碼
  │
  ├─> [Server] 發送驗證碼到 Email
  │
  ├─> 返回註冊成功訊息及 token
  │   {
  │     "id": 1,
  │     "name": "使用者",
  │     "email": "user@example.com",
  │     "token": "abc123..."
  │   }
  │
  ├─> 使用者收到 Email 驗證碼
  │
  ├─> 使用者輸入驗證碼
  │
  ├─> POST /user-auth/verify
  │   {
  │     "token": "abc123...",
  │     "code": "123456"
  │   }
  │
  ├─> [Server] 驗證驗證碼是否正確
  │
  ├─> [Server] 檢查驗證碼是否過期 (10分鐘)
  │
  ├─> [Server] 更新 User.isValid = true
  │
  ├─> [Server] 刪除 VerifyToken
  │
  ├─> [Server] 生成 JWT Token
  │
  └─> 返回 JWT Token,使用者自動登入
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "iat": 1705468800,
        "exp": 1705555200,
        "refreshExp": 1706073600
      }
```

**使用場景：**

1. **新使用者註冊**：首次使用系統的使用者註冊新帳號
2. **驗證碼過期**：使用者未在 10 分鐘內完成驗證,需重新發送驗證碼
3. **Email 未收到**：使用者需要重新發送驗證碼

**實作重點：**

- 驗證碼預設 10 分鐘過期
- 驗證成功後自動登入,返回 JWT Token
- 支援重新發送驗證碼功能
- 驗證碼為 6 位數字

---

### 3.3 情境三:使用者登入

**流程說明：** 使用者使用帳號密碼登入系統,取得 JWT Token。

**事件流程：**

```
使用者訪問登入頁面
  │
  ├─> 輸入帳號密碼
  │
  ├─> POST /user-auth/login
  │   {
  │     "account": "admin001",
  │     "password": "password123"
  │   }
  │
  ├─> [Server] 查詢使用者是否存在
  │
  ├─> [Server] 驗證密碼是否正確
  │
  ├─> [Server] 檢查 isEnabled 是否為 true
  │
  ├─> [Server] 更新 lastLoginAt
  │
  ├─> [Server] 生成 JWT Token
  │   - sub: userAccountId
  │   - username: 使用者姓名
  │   - exp: 過期時間
  │   - refreshExp: 刷新過期時間
  │
  └─> 返回 JWT Token
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "iat": 1705468800,
        "exp": 1705555200,
        "refreshExp": 1706073600
      }
```

**使用場景：**

1. **日常登入**：使用者每日登入系統
2. **重新登入**：Token 過期後重新登入
3. **多裝置登入**：使用者在不同裝置上登入

**實作重點：**

- 密碼錯誤統一返回「帳號或密碼錯誤」,避免洩漏帳號是否存在
- 檢查 isEnabled 狀態,未啟用的使用者無法登入
- 記錄最後登入時間 (lastLoginAt)
- JWT Token 包含 refreshExp,支援 Token 刷新機制

---

### 3.4 情境四：第三方登入 (Google/Line)

**流程說明：** 使用者使用 Google 或 Line 帳號登入,系統自動建立或取得使用者。

**事件流程：**

```
使用者訪問登入頁面
  │
  ├─> 點擊「使用 Google 登入」或「使用 Line 登入」
  │
  ├─> 前端取得第三方 Token (idToken/accessToken)
  │
  ├─> POST /user-auth/third-party-login
  │   {
  │     "type": "GOOGLE" 或 "LINE",
  │     "token": "third-party-token",
  │     "platform": "WEB" (Google 登入需提供)
  │   }
  │
  ├─> [Server] 驗證第三方 Token
  │   ├─> Google: 驗證 idToken
  │   └─> Line: 驗證 accessToken
  │
  ├─> [Server] 取得第三方使用者資料
  │   ├─> Google: name, email
  │   └─> Line: displayName
  │
  ├─> [Server] 檢查 UserAccount 是否已存在
  │   ├─> 存在: 取得現有 UserAccount
  │   └─> 不存在: 建立新 UserAccount
  │
  ├─> [Server] 檢查 User 是否已存在
  │   ├─> 存在: 取得現有 User
  │   └─> 不存在: 建立新 User (isValid=true, isEnabled=true)
  │
  ├─> [Server] 生成 JWT Token
  │
  └─> 返回 JWT Token
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "iat": 1705468800,
        "exp": 1705555200,
        "refreshExp": 1706073600
      }
```

**使用場景：**

1. **快速註冊登入**：使用者使用 Google/Line 快速註冊並登入
2. **跨平台登入**：使用者在不同平台使用相同的第三方帳號登入
3. **無需記憶密碼**：使用者不需要記憶額外的密碼

**實作重點：**

- 第三方登入的使用者自動啟用 (isValid=true, isEnabled=true)
- 如果使用者已存在,直接登入;否則自動建立新使用者
- Google 登入需提供 platform 參數 (WEB/IOS/ANDROID)
- Line 登入使用 accessToken 取得使用者資料

---

### 3.5 情境五：忘記密碼流程

**流程說明：** 使用者忘記密碼,透過 Email 或 SMS 接收驗證碼,驗證後重置密碼。

**事件流程：**

```
使用者訪問忘記密碼頁面
  │
  ├─> 輸入 Email 或手機號碼
  │
  ├─> 選擇接收方式 (EMAIL/SMS)
  │
  ├─> POST /user-auth/forget-password-token
  │   {
  │     "method": "EMAIL",
  │     "target": "user@example.com"
  │   }
  │
  ├─> [Server] 驗證使用者是否存在
  │
  ├─> [Server] 建立 VerifyToken (type=FORGET_PASSWORD)
  │
  ├─> [Server] 生成 6 位數驗證碼
  │
  ├─> [Server] 發送驗證碼
  │   ├─> EMAIL: 透過 Google Mail 發送
  │   └─> SMS: 透過 E8D SMS 發送
  │
  ├─> 返回 token
  │   {
  │     "token": "abc123..."
  │   }
  │
  ├─> 使用者收到驗證碼
  │
  ├─> 使用者輸入驗證碼
  │
  ├─> POST /user-auth/forget-password-verify
  │   {
  │     "token": "abc123...",
  │     "code": "123456"
  │   }
  │
  ├─> [Server] 驗證驗證碼是否正確
  │
  ├─> [Server] 刪除 FORGET_PASSWORD VerifyToken
  │
  ├─> [Server] 建立 FORGET_PASSWORD_RESET VerifyToken
  │
  ├─> 返回重置 token
  │   {
  │     "token": "xyz789..."
  │   }
  │
  ├─> 使用者輸入新密碼
  │
  ├─> POST /user-auth/forget-password-reset
  │   {
  │     "token": "xyz789...",
  │     "password": "newPassword123"
  │   }
  │
  ├─> [Server] 驗證 FORGET_PASSWORD_RESET token
  │
  ├─> [Server] 更新使用者密碼
  │
  ├─> [Server] 刪除 FORGET_PASSWORD_RESET token
  │
  └─> 返回成功訊息,引導使用者登入
```

**使用場景：**

1. **忘記密碼**：使用者忘記密碼需要重置
2. **驗證碼過期**：使用者需要重新發送驗證碼
3. **安全性考量**：懷疑帳號被盜,主動重置密碼

**實作重點：**

- 支援 Email 和 SMS 兩種接收方式
- 驗證碼驗證成功後,需要再次生成 FORGET_PASSWORD_RESET token
- 驗證碼預設 10 分鐘過期
- 重置密碼後,VerifyToken 會被刪除
- 密碼需符合安全性要求 (由前端或 DTO 驗證)

---

### 3.6 情境六：Token 刷新機制

**流程說明：** 當 JWT Token 過期但 refreshExp 未過期時,使用者可刷新 Token 延長登入狀態。

**事件流程：**

```
前端檢測到 Token 即將過期或已過期
  │
  ├─> POST /user-auth/refresh-token
  │   {
  │     "token": "expired-jwt-token"
  │   }
  │
  ├─> [Server] 驗證 Token (ignoreExpiration=true)
  │
  ├─> [Server] 檢查 refreshExp 是否過期
  │
  ├─> [Server] 生成新的 JWT Token
  │   - 保留原 sub, username
  │   - 保留原 refreshExp
  │   - 更新 iat, exp
  │
  └─> 返回新的 JWT Token
      {
        "token": "new-jwt-token",
        "iat": 1705555200,
        "exp": 1705641600,
        "refreshExp": 1706073600
      }
```

**使用場景：**

1. **自動刷新**：前端偵測 Token 即將過期,自動刷新
2. **長時間操作**：使用者在進行長時間操作時,Token 自動刷新
3. **無縫體驗**：使用者不需重新登入即可延長登入狀態

**實作重點：**

- refreshExp 為 0 表示無期限,永不過期
- 只有在 refreshExp 未過期時才能刷新
- 刷新後保留原 refreshExp,不會重新計算
- 前端應在 Token 過期前預先刷新,避免請求失敗

---

### 3.7 情境七：查詢使用者列表 (含篩選)

**流程說明：** 管理員查詢所有使用者,支援關鍵字搜尋、角色篩選、分頁。

**事件流程：**

```
管理員登入系統
  │
  ├─> 進入使用者管理頁面
  │
  ├─> GET /user?page=1&limit=20&keyword=admin&roleIds=1,2
  │
  ├─> [Server] 建立查詢條件
  │   ├─> 關鍵字搜尋: 名稱、帳號、Email、手機號碼
  │   ├─> 角色篩選: roleIds
  │   └─> 排除 isRoot=true 的超級管理員
  │
  ├─> [Server] 執行分頁查詢
  │
  ├─> [Server] 包含關聯資料
  │   ├─> userAccount
  │   ├─> userAccount.userAccountHasRole
  │   └─> userAccount.userAccountHasRole.role
  │
  └─> 返回使用者列表及分頁資訊
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
              "lastLoginAt": "2025-01-17T10:00:00Z"
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

**使用場景：**

1. **使用者列表瀏覽**：管理員瀏覽所有使用者
2. **搜尋特定使用者**：透過關鍵字搜尋特定使用者
3. **角色篩選**：查看特定角色的所有使用者

**實作重點：**

- 關鍵字搜尋支援: 名稱、帳號、Email、手機號碼
- 超級管理員 (isRoot=true) 不會出現在一般列表中
- 預設依 createdAt 降序排序
- 包含使用者的角色資訊

---

## 4. 系統流程圖

### 4.1 使用者註冊流程

```
使用者訪問註冊頁面
  │
  ├─> 填寫註冊資料
  │   ├─> 帳號 (必填)
  │   ├─> 密碼 (必填)
  │   ├─> 姓名 (必填)
  │   ├─> 手機 (必填)
  │   └─> Email (必填)
  │
  ├─> POST /user-auth/register
  │
  ├─> [Server] 驗證輸入資料
  │
  ├─> [Server] 檢查帳號是否已存在
  │   ├─> 已存在且 isValid=true → 返回「此帳號已存在」錯誤
  │   └─> 不存在或 isValid=false → 繼續
  │
  ├─> [Server] 建立/更新 UserAccount
  │
  ├─> [Server] 建立/更新 User (isValid=false)
  │
  ├─> [Server] 建立 VerifyToken (type=REGISTER)
  │
  ├─> [Server] 生成 6 位數驗證碼
  │
  ├─> [Server] 發送驗證碼到 Email
  │   ├─> 成功 → 返回註冊成功及 token
  │   └─> 失敗 → 返回「Email 發送失敗」錯誤
  │
  └─> 返回註冊成功訊息
      ├─> 使用者 ID
      ├─> 使用者姓名
      ├─> Email
      └─> VerifyToken

[使用者收到 Email 驗證碼]
  │
  ├─> 輸入驗證碼
  │
  ├─> POST /user-auth/verify
  │
  ├─> [Server] 驗證 token 是否存在
  │   ├─> 不存在 → 返回「找無此驗證 token」錯誤
  │   └─> 存在 → 繼續
  │
  ├─> [Server] 驗證驗證碼是否正確
  │   ├─> 錯誤 → 返回「驗證碼錯誤」
  │   └─> 正確 → 繼續
  │
  ├─> [Server] 檢查驗證碼是否過期
  │   ├─> 已過期 → 返回「驗證碼已過期」錯誤
  │   └─> 未過期 → 繼續
  │
  ├─> [Server] 更新 User.isValid = true
  │
  ├─> [Server] 刪除驗證記錄
  │
  ├─> [Server] 生成 JWT Token
  │
  └─> 返回 JWT Token,自動登入
```

### 4.2 使用者登入流程

```
使用者訪問登入頁面
  │
  ├─> 選擇登入方式
  │   ├─> 帳號密碼登入 → 4.2.1
  │   └─> 第三方登入 → 4.2.2
  │
  └─> 取得 JWT Token

4.2.1 帳號密碼登入:
  │
  ├─> 輸入帳號密碼
  │
  ├─> POST /user-auth/login
  │
  ├─> [Server] 查詢使用者
  │   ├─> 不存在 → 返回「帳號或密碼錯誤」
  │   └─> 存在 → 繼續
  │
  ├─> [Server] 驗證密碼
  │   ├─> 錯誤 → 返回「帳號或密碼錯誤」
  │   └─> 正確 → 繼續
  │
  ├─> [Server] 檢查 isEnabled
  │   ├─> false → 返回「使用者尚未啟用」錯誤
  │   └─> true → 繼續
  │
  ├─> [Server] 更新 lastLoginAt
  │
  ├─> [Server] 生成 JWT Token
  │
  └─> 返回 JWT Token

4.2.2 第三方登入:
  │
  ├─> 前端取得第三方 Token
  │
  ├─> POST /user-auth/third-party-login
  │
  ├─> [Server] 驗證第三方 Token
  │   ├─> 無效 → 返回「Token 無效」錯誤
  │   └─> 有效 → 繼續
  │
  ├─> [Server] 取得第三方使用者資料
  │
  ├─> [Server] 檢查 UserAccount 是否存在
  │   ├─> 存在 → 取得現有帳號
  │   └─> 不存在 → 建立新帳號
  │
  ├─> [Server] 檢查 User 是否存在
  │   ├─> 存在 → 取得現有使用者
  │   └─> 不存在 → 建立新使用者 (isValid=true)
  │
  ├─> [Server] 生成 JWT Token
  │
  └─> 返回 JWT Token
```

### 4.3 忘記密碼流程

```
使用者訪問忘記密碼頁面
  │
  ├─> 輸入 Email 或手機號碼
  │
  ├─> 選擇接收方式 (EMAIL/SMS)
  │
  ├─> POST /user-auth/forget-password-token
  │
  ├─> [Server] 驗證使用者是否存在
  │   ├─> 不存在 → 返回「找無此後台使用者」錯誤
  │   └─> 存在 → 繼續
  │
  ├─> [Server] 建立 VerifyToken (type=FORGET_PASSWORD)
  │
  ├─> [Server] 生成 6 位數驗證碼
  │
  ├─> [Server] 發送驗證碼
  │   ├─> EMAIL → 透過 Google Mail 發送
  │   ├─> SMS → 透過 E8D SMS 發送
  │   ├─> 成功 → 返回 token
  │   └─> 失敗 → 返回發送失敗錯誤
  │
  └─> 返回 VerifyToken

[使用者收到驗證碼]
  │
  ├─> 輸入驗證碼
  │
  ├─> POST /user-auth/forget-password-verify
  │
  ├─> [Server] 驗證驗證碼
  │   ├─> 錯誤 → 返回「驗證碼錯誤」
  │   └─> 正確 → 繼續
  │
  ├─> [Server] 刪除 FORGET_PASSWORD token
  │
  ├─> [Server] 建立 FORGET_PASSWORD_RESET token
  │
  └─> 返回重置 token

[使用者輸入新密碼]
  │
  ├─> POST /user-auth/forget-password-reset
  │
  ├─> [Server] 驗證 FORGET_PASSWORD_RESET token
  │   ├─> 無效 → 返回「找無此驗證 token」錯誤
  │   └─> 有效 → 繼續
  │
  ├─> [Server] 更新使用者密碼
  │
  ├─> [Server] 刪除 FORGET_PASSWORD_RESET token
  │
  └─> 返回成功訊息,引導使用者登入
```

### 4.4 管理員建立使用者流程

```
管理員登入系統
  │
  ├─> 進入使用者管理頁面
  │
  ├─> 點擊「新增使用者」
  │
  ├─> 填寫使用者資料
  │
  ├─> POST /user
  │
  ├─> [Server] 驗證輸入資料
  │
  ├─> [Server] 檢查角色是否存在
  │   ├─> 不存在 → 返回「找無此角色」錯誤
  │   └─> 存在 → 繼續
  │
  ├─> [Server] 檢查帳號是否重複
  │   ├─> 已存在 → 返回「此帳號已存在」錯誤
  │   └─> 不存在 → 繼續
  │
  ├─> [Server] 開啟 Transaction
  │   │
  │   ├─> 建立 UserAccount
  │   │
  │   ├─> 關聯角色 (UserAccountHasRole)
  │   │
  │   ├─> 建立 User
  │   │
  │   ├─> Commit
  │   │
  │   └─> 失敗則 Rollback
  │
  └─> 返回建立成功的使用者資料
```

---

## 5. 時序圖

### 5.1 使用者註冊時序圖

```
[使用者]          [前端]          [API]          [Database]       [Email服務]
   │                │               │                │                 │
   ├─ 填寫註冊資料 ─>│               │                │                 │
   │                ├─ POST /user-auth/register ────>│                 │
   │                │               │                │                 │
   │                │               ├─ 檢查帳號 ─────>│                 │
   │                │               │<─ 不存在 ───────┤                 │
   │                │               │                │                 │
   │                │               ├─ 建立 UserAccount & User ───────>│
   │                │               │<─ 建立成功 ─────┤                 │
   │                │               │                │                 │
   │                │               ├─ 生成驗證碼 ────────────────────>│
   │                │               │                │                 │
   │                │               ├─ 發送 Email ─────────────────────>│
   │                │               │                │                 │ (發送中)
   │                │<─ 返回 token ─┤                │                 │
   │<─ 註冊成功 ─────┤               │                │                 │
   │                │               │                │                 │
   │ (收到 Email)    │               │                │                 │
   │                │               │                │                 │
   ├─ 輸入驗證碼 ───>│               │                │                 │
   │                ├─ POST /user-auth/verify ──────>│                 │
   │                │               │                │                 │
   │                │               ├─ 驗證驗證碼 ───>│                 │
   │                │               │<─ 驗證成功 ─────┤                 │
   │                │               │                │                 │
   │                │               ├─ 更新 isValid=true ─────────────>│
   │                │               │<─ 更新成功 ─────┤                 │
   │                │               │                │                 │
   │                │               ├─ 生成 JWT Token ─┤                │
   │                │<─ 返回 Token ──┤                │                 │
   │<─ 驗證成功 ─────┤               │                │                 │
   │                │               │                │                 │
```

### 5.2 使用者登入時序圖

```
[使用者]          [前端]          [API]          [Database]
   │                │               │                │
   ├─ 輸入帳號密碼 ─>│               │                │
   │                ├─ POST /user-auth/login ───────>│
   │                │               │                │
   │                │               ├─ 查詢使用者 ───>│
   │                │               │<─ 使用者資料 ───┤
   │                │               │                │
   │                │               ├─ 驗證密碼 ──────┤
   │                │               │                │
   │                │               ├─ 檢查 isEnabled ┤
   │                │               │                │
   │                │               ├─ 更新 lastLoginAt ──────────────>│
   │                │               │<─ 更新成功 ─────┤
   │                │               │                │
   │                │               ├─ 生成 JWT Token ┤
   │                │<─ 返回 Token ──┤                │
   │<─ 登入成功 ─────┤               │                │
   │                │               │                │
```

### 5.3 第三方登入時序圖

```
[使用者]    [前端]    [Google/Line]    [API]    [Database]
   │           │            │             │           │
   ├─ 點擊登入 ─>│            │             │           │
   │           ├─ 請求授權 ─>│             │           │
   │           │            │ (授權頁面)   │           │
   │<─ 授權 ────────────────┤             │           │
   │           │<─ Token ───┤             │           │
   │           │            │             │           │
   │           ├─ POST /user-auth/third-party-login ─>│
   │           │            │             │           │
   │           │            │<─ 驗證 Token ┤           │
   │           │            ├─ 使用者資料 ─>│           │
   │           │            │             │           │
   │           │            │             ├─ 查詢使用者 ───────────────>│
   │           │            │             │<─ 使用者資料 (可能不存在) ──┤
   │           │            │             │           │
   │           │            │             ├─ 建立/取得 UserAccount & User ──>│
   │           │            │             │<─ 建立成功 ─┤
   │           │            │             │           │
   │           │            │             ├─ 生成 JWT Token ──┤
   │           │<─ 返回 Token ─────────────┤           │
   │<─ 登入成功 ─┤            │             │           │
   │           │            │             │           │
```

### 5.4 忘記密碼時序圖

```
[使用者]          [前端]          [API]          [Database]       [Email/SMS服務]
   │                │               │                │                 │
   ├─ 輸入 Email ───>│               │                │                 │
   │                ├─ POST /user-auth/forget-password-token ────────>│
   │                │               │                │                 │
   │                │               ├─ 查詢使用者 ───>│                 │
   │                │               │<─ 使用者存在 ───┤                 │
   │                │               │                │                 │
   │                │               ├─ 建立 VerifyToken ──────────────>│
   │                │               │                │                 │
   │                │               ├─ 生成驗證碼 ────────────────────>│
   │                │               │                │                 │ (發送中)
   │                │<─ 返回 token ─┤                │                 │
   │<─ 發送成功 ─────┤               │                │                 │
   │                │               │                │                 │
   │ (收到驗證碼)     │               │                │                 │
   │                │               │                │                 │
   ├─ 輸入驗證碼 ───>│               │                │                 │
   │                ├─ POST /user-auth/forget-password-verify ───────>│
   │                │               │                │                 │
   │                │               ├─ 驗證驗證碼 ───>│                 │
   │                │               │<─ 驗證成功 ─────┤                 │
   │                │               │                │                 │
   │                │               ├─ 刪除舊 token & 建立新 token ───>│
   │                │<─ 返回 reset token ─┤            │                 │
   │<─ 驗證成功 ─────┤               │                │                 │
   │                │               │                │                 │
   ├─ 輸入新密碼 ───>│               │                │                 │
   │                ├─ POST /user-auth/forget-password-reset ─────────>│
   │                │               │                │                 │
   │                │               ├─ 驗證 reset token ─────────────>│
   │                │               │<─ token 有效 ───┤                 │
   │                │               │                │                 │
   │                │               ├─ 更新密碼 ─────>│                 │
   │                │               │<─ 更新成功 ─────┤                 │
   │                │               │                │                 │
   │                │<─ 返回成功 ────┤                │                 │
   │<─ 密碼已重置 ───┤               │                │                 │
   │                │               │                │                 │
```

---

## 6. 事件流程說明

### 6.1 註冊事件流程

| 步驟 | 事件                   | 觸發者 | 說明                                     |
| ---- | ---------------------- | ------ | ---------------------------------------- |
| 1    | 填寫註冊資料           | 使用者 | 輸入帳號、密碼、姓名、手機、Email        |
| 2    | POST /user-auth/register | 前端   | 發送註冊請求                             |
| 3    | 檢查帳號是否存在       | Server | 查詢 UserAccount 是否已存在且 isValid=true |
| 4    | 建立 UserAccount       | Server | 建立帳號資料 (account, password)         |
| 5    | 建立 User              | Server | 建立使用者資料 (isValid=false)           |
| 6    | 建立 VerifyToken       | Server | 建立驗證 token (type=REGISTER)           |
| 7    | 生成驗證碼             | Server | 生成 6 位數驗證碼                        |
| 8    | 發送驗證碼到 Email     | Server | 透過 Google Mail 發送驗證碼              |
| 9    | 返回註冊成功           | Server | 返回使用者資料及 VerifyToken             |
| 10   | 收到 Email 驗證碼      | 使用者 | 查看 Email 中的驗證碼                    |
| 11   | 輸入驗證碼             | 使用者 | 在前端輸入驗證碼                         |
| 12   | POST /user-auth/verify | 前端   | 發送驗證請求                             |
| 13   | 驗證驗證碼             | Server | 檢查驗證碼是否正確且未過期               |
| 14   | 更新 User.isValid=true | Server | 啟用使用者帳號                           |
| 15   | 刪除驗證記錄           | Server | 刪除 Verification 和 VerifyToken         |
| 16   | 生成 JWT Token         | Server | 生成登入 Token                           |
| 17   | 返回 JWT Token         | Server | 使用者自動登入                           |

### 6.2 登入事件流程

| 步驟 | 事件                 | 觸發者 | 說明                              |
| ---- | -------------------- | ------ | --------------------------------- |
| 1    | 輸入帳號密碼         | 使用者 | 在登入頁面輸入帳號和密碼          |
| 2    | POST /user-auth/login | 前端   | 發送登入請求                      |
| 3    | 查詢使用者           | Server | 根據 account 查詢 User            |
| 4    | 驗證密碼             | Server | 比對密碼是否正確                  |
| 5    | 檢查 isEnabled       | Server | 確認使用者帳號已啟用              |
| 6    | 更新 lastLoginAt     | Server | 記錄最後登入時間                  |
| 7    | 生成 JWT Token       | Server | 生成包含 sub, username, exp 的 Token |
| 8    | 返回 JWT Token       | Server | 返回 Token 及過期時間資訊         |

### 6.3 Token 刷新事件流程

| 步驟 | 事件                      | 觸發者 | 說明                                  |
| ---- | ------------------------- | ------ | ------------------------------------- |
| 1    | 偵測 Token 即將過期       | 前端   | 前端自動偵測或請求失敗時觸發          |
| 2    | POST /user-auth/refresh-token | 前端   | 發送刷新請求                          |
| 3    | 驗證 Token                | Server | 驗證 Token (ignoreExpiration=true)    |
| 4    | 檢查 refreshExp           | Server | 確認 refreshExp 未過期                |
| 5    | 生成新 JWT Token          | Server | 保留原 sub, username, refreshExp      |
| 6    | 返回新 JWT Token          | Server | 返回新 Token 及過期時間資訊           |

---

## 7. 業務規則與限制

### 7.1 帳號管理規則

| 規則編號 | 規則名稱         | 說明                                                     |
| -------- | ---------------- | -------------------------------------------------------- |
| BR-001   | 帳號唯一性       | 同一帳號 (account) 不可重複註冊 (isValid=true 的情況下) |
| BR-002   | 密碼加密         | 所有密碼必須經過加密後儲存,不得以明文儲存                |
| BR-003   | 預設啟用狀態     | 新建使用者預設 isEnabled=true                            |
| BR-004   | 註冊需驗證       | 透過註冊流程建立的使用者 isValid=false,需驗證後啟用      |
| BR-005   | 管理員建立免驗證 | 管理員建立的使用者 isValid=true,無需驗證                 |
| BR-006   | 第三方登入免驗證 | 第三方登入的使用者 isValid=true,自動啟用                 |
| BR-007   | 超級管理員權限   | isRoot=true 的使用者擁有所有權限,不受角色限制            |
| BR-008   | 超級管理員隱藏   | 超級管理員 (isRoot=true) 不會出現在一般使用者列表中      |

### 7.2 認證與安全規則

| 規則編號 | 規則名稱         | 說明                                              |
| -------- | ---------------- | ------------------------------------------------- |
| BR-101   | 驗證碼長度       | 所有驗證碼為 6 位數字                             |
| BR-102   | 驗證碼過期時間   | 驗證碼預設 10 分鐘過期                            |
| BR-103   | 驗證碼使用次數   | 驗證碼只能使用一次,驗證成功後立即刪除             |
| BR-104   | JWT Token 包含資訊 | Token 包含 sub (userAccountId), username, exp, refreshExp |
| BR-105   | Token 刷新機制   | 只有在 refreshExp 未過期時才能刷新 Token          |
| BR-106   | refreshExp=0     | refreshExp 為 0 表示無期限,永不過期               |
| BR-107   | 登入狀態檢查     | 未啟用 (isEnabled=false) 的使用者無法登入         |
| BR-108   | 密碼錯誤訊息     | 密碼錯誤統一返回「帳號或密碼錯誤」,避免洩漏帳號資訊 |
| BR-109   | 最後登入時間     | 每次登入成功後更新 lastLoginAt                    |

### 7.3 權限管理規則

| 規則編號 | 規則名稱       | 說明                                                |
| -------- | -------------- | --------------------------------------------------- |
| BR-201   | 角色權限關聯   | 使用者透過角色 (Role) 獲得權限 (Permission)         |
| BR-202   | 多角色支援     | 一個使用者可以擁有多個角色                          |
| BR-203   | 超級管理員例外 | isRoot=true 的使用者擁有所有權限,不需檢查角色       |
| BR-204   | 權限檢查點     | 所有需要權限的 API 必須通過 @UseAuth() 裝飾器保護   |
| BR-205   | 權限驗證       | checkPermission API 可驗證使用者是否擁有指定權限    |

### 7.4 資料完整性規則

| 規則編號 | 規則名稱          | 說明                                              |
| -------- | ----------------- | ------------------------------------------------- |
| BR-301   | 使用者帳號關聯    | User 必須關聯到 UserAccount (userAccountId)       |
| BR-302   | 軟刪除機制        | 刪除使用者時執行軟刪除,實際刪除 UserAccount       |
| BR-303   | Cascade 刪除      | 刪除 UserAccount 會自動刪除關聯的 User 資料       |
| BR-304   | Transaction 保護  | 建立使用者必須在 Transaction 中執行,確保原子性    |
| BR-305   | 角色存在性驗證    | 建立/更新使用者時,必須先驗證角色是否存在          |

### 7.5 第三方整合規則

| 規則編號 | 規則名稱           | 說明                                        |
| -------- | ------------------ | ------------------------------------------- |
| BR-401   | Google 登入 platform | Google 登入必須提供 platform 參數 (WEB/IOS/ANDROID) |
| BR-402   | Line 登入 token    | Line 登入使用 accessToken                   |
| BR-403   | 第三方登入自動建立 | 第三方登入時,如果使用者不存在會自動建立     |
| BR-404   | Email 驗證碼       | 註冊和忘記密碼的 Email 驗證碼透過 Google Mail 發送 |
| BR-405   | SMS 驗證碼         | 忘記密碼的 SMS 驗證碼透過 E8D SMS 發送      |

---

## 8. 資料流向

### 8.1 註冊資料流向

```
使用者輸入
  ↓
前端驗證
  ↓
POST /user-auth/register
  ↓
UserAuthService.registerWithVerification()
  ↓
Transaction 開始
  ├─> UserAccountService.create() → UserAccount 建立
  ├─> Prisma.user.create() → User 建立 (isValid=false)
  └─> Prisma.verifyToken.create() → VerifyToken 建立
  ↓
Transaction 提交
  ↓
VerificationService.create() → 生成驗證碼
  ↓
GoogleMailService.sendMail() → 發送 Email
  ↓
返回 RegisterEntity (id, name, email, token)
  ↓
前端顯示驗證頁面
  ↓
使用者輸入驗證碼
  ↓
POST /user-auth/verify
  ↓
VerificationService.verify() → 驗證驗證碼
  ↓
UserService.update() → 更新 isValid=true
  ↓
UserAuthService.getJwtToken() → 生成 JWT Token
  ↓
返回 TokenEntity (token, iat, exp, refreshExp)
```

### 8.2 登入資料流向

```
使用者輸入帳號密碼
  ↓
POST /user-auth/login
  ↓
UserService.findByAccountOrThrow() → 查詢使用者
  ↓
檢查 isEnabled === true
  ↓
UserAccountService.login() → 驗證密碼
  ↓
更新 lastLoginAt
  ↓
UserAuthService.getJwtToken()
  ├─> JwtService.signAsync() → 生成 JWT Token
  └─> 包含: sub, username, exp, refreshExp
  ↓
返回 TokenEntity
```

### 8.3 第三方登入資料流向

```
使用者點擊 Google/Line 登入
  ↓
前端取得第三方 Token
  ↓
POST /user-auth/third-party-login
  ↓
驗證第三方 Token
  ├─> Google: GoogleLoginService.login()
  └─> Line: LineLoginService.login()
  ↓
取得使用者資料 (name, email)
  ↓
Transaction 開始
  ├─> 查詢或建立 UserAccount
  └─> 查詢或建立 User (isValid=true)
  ↓
Transaction 提交
  ↓
UserAuthService.getJwtToken() → 生成 JWT Token
  ↓
返回 TokenEntity
```

### 8.4 忘記密碼資料流向

```
使用者輸入 Email/手機
  ↓
POST /user-auth/forget-password-token
  ↓
UserService.findFirstOrThrow() → 驗證使用者存在
  ↓
VerifyTokenService.create() → 建立 VerifyToken (type=FORGET_PASSWORD)
  ↓
VerificationService.create() → 生成驗證碼
  ↓
發送驗證碼
  ├─> Email: GoogleMailService.sendMail()
  └─> SMS: E8dSmsService.sendSms()
  ↓
返回 ForgetPasswordEntity (token)
  ↓
使用者輸入驗證碼
  ↓
POST /user-auth/forget-password-verify
  ↓
VerificationService.verify() → 驗證驗證碼
  ↓
刪除 FORGET_PASSWORD VerifyToken
  ↓
建立 FORGET_PASSWORD_RESET VerifyToken
  ↓
返回 ForgetPasswordVerifyEntity (reset token)
  ↓
使用者輸入新密碼
  ↓
POST /user-auth/forget-password-reset
  ↓
VerifyTokenService.findOrThrow() → 驗證 reset token
  ↓
UserAccountService.resetPassword() → 更新密碼
  ↓
刪除 FORGET_PASSWORD_RESET VerifyToken
  ↓
返回成功訊息
```

---

## 9. 非功能性需求

### 9.1 效能需求

| 需求編號 | 需求項目         | 目標值              | 說明                           |
| -------- | ---------------- | ------------------- | ------------------------------ |
| NFR-001  | API 回應時間     | < 500ms             | 一般 API 回應時間應小於 500ms  |
| NFR-002  | 登入回應時間     | < 1s                | 登入 API 回應時間應小於 1 秒   |
| NFR-003  | 查詢列表分頁     | 預設 20 筆/頁       | 避免一次查詢過多資料           |
| NFR-004  | 資料庫連線池     | 最小 10, 最大 100   | 使用連線池管理資料庫連線       |
| NFR-005  | Token 過期時間   | 可設定 (預設 24小時) | JWT Token 過期時間可透過環境變數設定 |

### 9.2 安全性需求

| 需求編號 | 需求項目           | 說明                                          |
| -------- | ------------------ | --------------------------------------------- |
| NFR-101  | 密碼加密           | 使用 bcrypt 加密密碼,至少 10 rounds           |
| NFR-102  | JWT Secret         | JWT Secret 必須透過環境變數設定,不可寫死在程式碼中 |
| NFR-103  | HTTPS 傳輸         | 生產環境必須使用 HTTPS 加密傳輸               |
| NFR-104  | 驗證碼有效期       | 驗證碼預設 10 分鐘過期,避免被暴力破解         |
| NFR-105  | 密碼複雜度要求     | 建議前端實作密碼複雜度驗證 (長度、大小寫、數字) |
| NFR-106  | SQL Injection 防護 | 使用 Prisma ORM,避免 SQL Injection 攻擊       |
| NFR-107  | XSS 防護           | API 回傳的資料需經過適當的 sanitize           |

### 9.3 可用性需求

| 需求編號 | 需求項目       | 目標值   | 說明                         |
| -------- | -------------- | -------- | ---------------------------- |
| NFR-201  | 系統可用性     | > 99.5%  | 系統年度可用性應大於 99.5%   |
| NFR-202  | 錯誤訊息明確性 | 100%     | 所有錯誤都應返回明確的錯誤訊息 |
| NFR-203  | API 文件完整性 | 100%     | 所有 API 都應有完整的 Swagger 文件 |
| NFR-204  | 日誌記錄       | 關鍵操作 | 記錄登入、註冊、密碼重置等關鍵操作 |

### 9.4 可維護性需求

| 需求編號 | 需求項目         | 說明                                    |
| -------- | ---------------- | --------------------------------------- |
| NFR-301  | 程式碼規範       | 遵循 TypeScript 和 NestJS 最佳實踐      |
| NFR-302  | 錯誤處理統一     | 使用統一的錯誤處理機制 (abort, catchPrismaErrorOrThrow) |
| NFR-303  | Transaction 使用 | 所有涉及多表操作的功能必須使用 Transaction |
| NFR-304  | 服務分層         | 遵循 Controller → Service → Repository 分層架構 |
| NFR-305  | 單元測試覆蓋率   | 核心業務邏輯測試覆蓋率應 > 80%          |

### 9.5 擴展性需求

| 需求編號 | 需求項目           | 說明                                  |
| -------- | ------------------ | ------------------------------------- |
| NFR-401  | 第三方登入擴展     | 架構支援新增更多第三方登入方式        |
| NFR-402  | 驗證碼發送方式擴展 | 支援新增更多驗證碼發送方式 (如: Slack) |
| NFR-403  | 權限系統擴展       | 支援更細粒度的權限控制                |
| NFR-404  | 多租戶支援         | 預留 orgId 欄位,支援未來的多租戶需求  |

---

## 10. 版本歷史

| 版本 | 日期       | 說明                                  | 作者   |
| ---- | ---------- | ------------------------------------- | ------ |
| v1.0 | 2025-01-17 | 初版發布,完成使用者管理系統 SA 文件撰寫 | Claude |

---

**© 2025 Sys Public Property API. All rights reserved.**
