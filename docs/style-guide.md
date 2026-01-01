# UI/UX 設計規範

## 設計風格

### 核心風格

- **設計語言**: Glassmorphism - 毛玻璃質感的現代化界面
- **背景**: 天空藍漸層 `bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100`
- **主要元素**: 半透明白色卡片搭配柔和陰影
- **圓角**: 統一使用 `rounded-2xl` (16px) 或 `rounded-3xl` (24px)
- **視覺層次**: 透明度和陰影營造深度感

### 色彩系統

**主要色彩**:

- 背景漸層: `bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100`
- 卡片背景: `bg-white/50` 搭配 `backdrop-blur-lg`
- 主要文字: `text-slate-600` / `text-slate-700`
- 次要文字: `text-slate-500`

**狀態色彩**:

- 成功/啟用: `bg-green-100/80 text-green-700`
- 警告: `bg-yellow-100/80 text-yellow-700`
- 停用/失敗: `bg-gray-100/80 text-gray-600`
- 危險: `bg-red-100/80 text-red-700`

**互動狀態**:

- Focus: `focus:ring-2 focus:ring-slate-300 focus:border-slate-300`
- Hover: 透明度增加，陰影加深，輕微縮放 `hover:scale-[1.02]`
- 過渡: `transition-all duration-200`

## 佈局架構

### 雙佈局系統

#### 1. 側邊欄佈局 (Sidebar Layout)

**適用**: 管理頁面、列表頁、儀表板等需要導航的功能頁面

**結構**:

```
┌────────────┬─────────────────────┐
│  Sidebar   │    Main Content     │
│            │                     │
│ Navigation │   Header + Content  │
│   Items    │                     │
└────────────┴─────────────────────┘
```

**特性**:

- 固定側邊欄: `fixed left-0 top-0 h-full`
- 響應式寬度: 展開 `w-32` (128px) / 收起 `w-16` (64px)
- 主內容適配: `ml-32` 或 `ml-16`
- 狀態持久化: localStorage 儲存
- **預設狀態**: 展開模式

#### 2. 集中佈局 (Centered Layout)

**適用**: 登入頁、錯誤頁、引導頁等獨立頁面

**結構**:

```
┌─────────────────────────────────┐
│                                 │
│         ┌─────────┐             │
│         │ Content │             │
│         │  Card   │             │
│         └─────────┘             │
│                                 │
└─────────────────────────────────┘
```

**特性**:

- 全螢幕背景: `min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100`
- 居中對齊: `flex items-center justify-center`
- 內容卡片: `max-w-md w-full` 限制寬度

## 導航系統

### 側邊欄導航設計

**導航容器**:

- 定位: `fixed left-0 top-0 h-full`
- 樣式: `bg-white/50 backdrop-blur-lg border-r border-white/40 shadow-xl shadow-black/5`
- 過渡: `transition-all duration-300`

**導航項目**:

- 基礎: `bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-lg shadow-black/10`
- 展開尺寸: `h-10 px-2 py-2 space-x-2`
- 收起尺寸: `w-9 h-9 justify-center`
- 圖標: `w-4 h-4 text-slate-600`
- 文字: `text-xs text-slate-600`
- Hover: `hover:bg-slate-300/80 hover:shadow-xl hover:scale-[1.02]`

**標準配置**:

```javascript
const navItems = [
  { icon: CalendarIcon, label: '資料群組管理', route: '/dataset-group' },
  { icon: UserGroupIcon, label: '人員管理', route: '/user' },
  { icon: FolderIcon, label: '欄位管理', route: '/global-key' },
  { icon: ClockIcon, label: '資料管理', route: '/dataset' },
  { icon: CogIcon, label: '上傳檔案', route: '/upload' },
  { icon: DocumentIcon, label: '上傳紀錄', route: '/upload-history' },
]
```

## 組件設計規範

### 基礎組件

**輸入框**:

```css
bg-white/40 backdrop-blur-sm
border border-slate-300/50 rounded-2xl
px-4 py-3 text-slate-600
focus:ring-2 focus:ring-slate-300 focus:border-slate-300
```

**按鈕**:

```css
bg-slate-100/80 backdrop-blur-sm
border border-slate-200/60 rounded-2xl
shadow-lg shadow-black/10
hover:bg-slate-300/80 hover:shadow-xl hover:scale-[1.02]
```

**卡片**:

```css
bg-white/50 backdrop-blur-lg
border border-white/40 rounded-3xl
shadow-xl shadow-black/5
p-8
```

### 表格設計

**表格容器**:

```css
bg-white/50 backdrop-blur-lg
border border-white/40 rounded-2xl
shadow-lg shadow-black/5
overflow-hidden
```

**表格頭部**:

```css
bg-slate-100/60
border-b border-slate-200/50
px-6 py-4
text-slate-700 font-semibold text-sm
```

**表格行**:

```css
border-b border-slate-200/20
px-6 py-4
hover:bg-slate-300/80 transition-all duration-200
text-slate-600
```

### 操作按鈕

**基礎設計**:

- 尺寸: `w-8 h-8` 正方形
- 圖標: `w-4 h-4`
- 過渡: `transition-all duration-200`
- Hover: `hover:shadow-xl hover:scale-[1.02]`

**顏色編碼**:

- 查看: `bg-slate-100/80 border-slate-200/60 text-slate-700`
- 編輯: `bg-blue-100/80 border-blue-200/60 text-blue-700`
- 狀態切換: 綠色(啟用) / 灰色(停用)
- 刪除: `bg-red-100/80 border-red-200/60 text-red-600`

**排列順序**: 查看 → 編輯 → 狀態切換 → 刪除

## 內容區域規範

### 側邊欄佈局內容

**主內容容器**:

- 左邊距: `ml-32` (展開) / `ml-16` (收起)
- 過渡: `transition-all duration-300`
- 最小高度: `min-h-screen`

**區域劃分**:

1. **頁面標題**: `px-6 pt-6 pb-4` + `text-2xl font-semibold text-slate-600`
2. **工具列**: `px-6 py-4` + `flex justify-end`
3. **主要內容**: `px-6 py-4` + `space-y-6`
4. **底部區域**: `px-6 py-8`

### 集中佈局內容

**全螢幕容器**:

- 背景: `min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100`
- 佈局: `flex items-center justify-center`
- 內邊距: `py-12 px-4 sm:px-6 lg:px-8`

**主內容卡片**:

- 容器: `max-w-md w-full`
- 卡片: `backdrop-blur-lg bg-white/50 rounded-3xl border border-white/40 shadow-xl shadow-black/5 p-8`
- 內容間距: `space-y-8`

## 留白系統

**基礎間距** (基於 8px 網格):

- 精緻: `p-2` / `space-y-2` (8px)
- 小: `p-3` / `space-y-3` (12px)
- 標準: `p-4` / `space-y-4` (16px)
- 大: `p-6` / `space-y-6` (24px)
- 特大: `p-8` / `space-y-8` (32px)

**應用原則**:

- 容器層: `p-6` 或 `p-8`
- 組件層: `p-4`
- 元素層: `p-3`
- 精緻層: `p-2`

## 響應式基本原則

### 斷點

- SM: `640px+` (手機橫向/小平板)
- MD: `768px+` (平板)
- LG: `1024px+` (桌機)
- XL: `1280px+` (大螢幕)

### 導航響應式

- **桌面** (LG+): 固定顯示側邊欄，預設展開
- **平板** (MD-LG): 可切換，覆蓋模式
- **手機** (<MD): 隱藏，通過選單觸發

### 內容適配

- **字體**: Mobile `text-sm/text-xl` → Desktop `text-base/text-2xl`
- **間距**: Mobile `p-4/space-y-4` → Desktop `p-8/space-y-8`
- **卡片**: Mobile `rounded-2xl` → Desktop `rounded-3xl`

## 響應式字級系統

### 系統架構

專案使用集中式的響應式字級系統，透過 Tailwind CSS 的響應式類別確保在不同裝置上提供最佳的閱讀體驗：

- **配置文件**: `src/constants/typographyConstants.ts`
- **技術實現**: Tailwind CSS 響應式類別 (如 `text-xs md:text-sm`)
- **斷點**: 手機版 `< 768px`、桌面版 `>= 768px (md:)`

### 字級配置

所有組件的字級都遵循統一的響應式規範：

| 組件類型        | 手機版字級  | 桌面版字級  | 使用配置                         |
| --------------- | ----------- | ----------- | -------------------------------- |
| 頁面標題        | `text-xl`   | `text-2xl`  | `PAGE_TITLE_TEXT_SIZE`           |
| 小節標題        | `text-base` | `text-lg`   | `SECTION_TITLE_TEXT_SIZE`        |
| 按鈕 (small)    | `text-xs`   | `text-xs`   | `BUTTON_TEXT_SIZES.small`        |
| 按鈕 (medium)   | `text-xs`   | `text-sm`   | `BUTTON_TEXT_SIZES.medium`       |
| 按鈕 (full)     | `text-sm`   | `text-base` | `BUTTON_TEXT_SIZES.full`         |
| 輸入框 (small)  | `text-xs`   | `text-sm`   | `INPUT_TEXT_SIZES.small`         |
| 輸入框 (medium) | `text-sm`   | `text-base` | `INPUT_TEXT_SIZES.medium`        |
| 標籤 (Label)    | `text-xs`   | `text-sm`   | `LABEL_TEXT_SIZE`                |
| 表格頭部        | `text-xs`   | `text-sm`   | `TABLE_TEXT_SIZES.header`        |
| 表格內容        | `text-xs`   | `text-sm`   | `TABLE_TEXT_SIZES.body`          |
| Modal 標題      | `text-base` | `text-lg`   | `MODAL_TEXT_SIZES.title`         |
| Select 選擇器   | `text-sm`   | `text-base` | `SELECT_TEXT_SIZES.trigger`      |
| Select 選項     | `text-xs`   | `text-sm`   | `SELECT_TEXT_SIZES.option`       |
| Checkbox 標籤   | `text-xs`   | `text-sm`   | `CHECKBOX_RADIO_LABEL_TEXT_SIZE` |
| Radio 標籤      | `text-xs`   | `text-sm`   | `CHECKBOX_RADIO_LABEL_TEXT_SIZE` |
| Badge           | `text-xs`   | `text-xs`   | `BADGE_TEXT_SIZE`                |
| Toast           | `text-xs`   | `text-sm`   | `TOAST_TEXT_SIZE`                |

### 使用方式

#### 在組件中使用響應式字級

```typescript
import { BUTTON_TEXT_SIZES } from '@/constants/typographyConstants'

// 直接使用響應式字級常數
const textClass = BUTTON_TEXT_SIZES.medium
// 值為: 'text-xs md:text-sm'
```

#### 在模板中應用

```vue
<template>
  <button :class="['px-4 py-2', textClass]">按鈕文字</button>
</template>
```

或直接在模板中使用：

```vue
<template>
  <button :class="['px-4 py-2', BUTTON_TEXT_SIZES.medium]">按鈕文字</button>
</template>
```

### 設計原則

1. **手機優先**: 手機版使用較小字級，提供精緻細膩的視覺效果
2. **桌面舒適**: 桌面版使用標準字級，確保舒適的閱讀體驗
3. **一致性**: 所有組件遵循統一的字級規範
4. **可維護性**: 集中式配置，修改字級只需調整一處
5. **性能優化**: 使用純 CSS 媒體查詢，無 JavaScript 運行時開銷

### 新增組件時的注意事項

創建新組件時，請遵循以下步驟：

1. **選擇合適的字級配置**: 從 `typographyConstants.ts` 中選擇或新增配置
2. **直接引入常數**: 在組件中引入相應的字級常數
3. **應用響應式類別**: 直接使用常數值，Tailwind 會自動處理響應式邏輯
4. **測試響應式效果**: 在不同螢幕尺寸下測試字級變化

### 技術優勢

- **零運行時開銷**: 不使用 JavaScript resize 事件監聽，完全依賴 CSS 媒體查詢
- **更好的性能**: 瀏覽器原生處理響應式，無需額外的 Vue 響應式系統
- **簡化代碼**: 減少抽象層，代碼更直觀易懂
- **SSR 友好**: 純 CSS 方案，無需客戶端 JavaScript 即可正常運作
