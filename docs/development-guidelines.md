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
