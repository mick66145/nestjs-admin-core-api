# 程式碼風格指南

本指南提供本專案的程式碼風格規範，確保所有程式碼的一致性與可讀性。**如有特殊需求，請依功能需求補充自訂規範。**

---

## 1. 通用原則

1. 保持程式碼簡潔、清晰、易於理解
2. 遵循一致的命名慣例
3. 避免過深的巢狀結構
4. 善用 TypeScript 類型系統，明確定義類型
5. **API 文件完整性**：所有公共 API 接口（Controller 方法）及其請求/響應數據模型（DTO/Entity）應全面使用 Swagger 裝飾器進行描述，以確保自動生成的 API 文件清晰、完整
6. **清晰的職責分離**：嚴格遵循分層架構，確保每個組件（Controller, Service, DataAggregator 等）只負責其核心功能，避免職責混淆

---

## 2. 命名慣例

- **變數與函式**：`camelCase`（如：`userName`, `getUserProfile`）
- **類別與介面**：`PascalCase`（如：`UserService`, `UserProfileInterface`）
- **檔案**：`kebab-case`（如：`user-service.ts`, `user-profile.interface.ts`）
  - **模塊內部組織**：對於 DTOs 和 Entities 等相關文件，應將其組織在模塊內部的專屬子目錄中（例如 `dto/` 和 `entities/`），且檔案命名需與類別名稱對應（如：`dto/create-dataset-key.dto.ts` 對應 `CreateDatasetKeyDto`）
- **常數**：`SCREAMING_SNAKE_CASE`（如：`DEFAULT_PAGE_SIZE`, `API_KEY`）

---

## 3. 格式化

- **縮排**：2 個空格
- **引號**：優先使用單引號 `'...'`
- **分號**：每行結尾必加分號
- **空行**：邏輯區塊間加空行提升可讀性
- **逗號**：物件/陣列最後一個元素加尾逗號（trailing comma）

---

## 4. 註釋

- 公開類別、方法、函式請用 JSDoc/TypeScript Doc 撰寫註釋
- 複雜邏輯、演算法或不易理解的程式碼需加行內註釋
- 註釋需與程式碼同步更新

### 4.1 註釋風格規範

**TypeScript/JavaScript 註釋風格：**

使用 JSDoc 風格的 `/** */` 多行註釋，而非三斜線 `///` 註釋：

```typescript
// ✅ 正確：使用 JSDoc 風格
interface CreateUserDto {
  /** 使用者名稱 */
  name: string;
  /** 電子郵件地址 */
  email: string;
  /** 年齡（可選） */
  age?: number;
}

enum UserRole {
  /** 管理員 */
  ADMIN = 'ADMIN',
  /** 一般使用者 */
  USER = 'USER',
}

// ❌ 錯誤：不要使用三斜線註釋
interface CreateUserDto {
  /// 使用者名稱
  name: string;
  /// 電子郵件地址
  email: string;
}
```

**註釋格式要點：**

- 單行註釋：`/** 說明文字 */`
- 多行註釋：
  ```typescript
  /**
   * 說明文字第一行
   * 說明文字第二行
   */
  ```
- Enum 值註釋：每個列舉值前加註釋
- 介面/類別屬性：每個屬性前加註釋
- 可選屬性：在註釋中明確標示「可選」

---

## 5. TypeScript 特定規範

- **明確類型聲明**：避免使用 `any`，除非無法避免且經過審慎考量
- **介面與型別別名**：用 `interface` 定義物件結構，`type` 定義複合型別或別名
- **唯讀屬性**：不可變屬性請加 `readonly`

---

## 6. 關聯資源驗證規範

### 6.1 關聯資源必須先驗證再關聯

在 Service 層處理包含關聯資源（foreign key）的操作時，**必須遵循以下步驟**：

1. **先驗證關聯資源存在**：使用相關服務的 `findOne()` 方法驗證被關聯的資源是否存在
2. **再執行關聯操作**：確認關聯資源存在後，才能在 `Prisma` 操作中使用 `connect` 進行關聯

### 6.2 實作範例

```typescript
// src/property/property.service.ts
async create(dto: CreatePropertyDto) {
  const {
    propertyUsageCategory: propertyUsageCategoryDto,
    propertyUsageZone: propertyUsageZoneDto,
    ...propertyData
  } = dto;

  // 步驟 1: 先驗證關聯資源存在（會拋出 NOT_FOUND 異常如果不存在）
  const propertyUsageCategory =
    await this.propertyUsageCategoryService.findOne(
      propertyUsageCategoryDto.id,
    );
  const propertyUsageZone = await this.propertyUsageZoneService.findOne(
    propertyUsageZoneDto.id,
  );

  // 步驟 2: 關聯資源已驗證，安全地執行 connect 操作
  const data: Prisma.PropertyCreateInput = {
    ...propertyData,
    propertyUsageZone: {
      connect: { id: propertyUsageZone.id },
    },
    propertyUsageCategory: {
      connect: { id: propertyUsageCategory.id },
    },
  };

  // 執行資料庫操作
  const orm = await this.prisma.$transaction(async (tx) => {
    return await tx.property.create({
      data,
      include: this.include,
    });
  }).catch(catchPrismaErrorOrThrow(entityName));

  return plainToInstance(PropertyEntity, orm);
}
```

### 6.3 規則重點

- **驗證先行**：永遠不能假設關聯資源存在，必須主動驗證
- **服務注入**：在 Service 的 `constructor` 中注入關聯的服務（如 `PropertyUsageCategoryService`）
- **錯誤處理**：`findOne()` 方法若資源不存在會拋出 `HttpException(NOT_FOUND)`，這會自動傳播至 Controller 並返回 404 錯誤
- **事務保護**：驗證後的操作應包含在 `$transaction` 中，確保數據一致性
- **適用場景**：此規則適用於所有涉及外鍵關聯的 create/update 操作

---

## 7. 架構與範例（以 `src/dataset` 模組為例）

### 7.1 DTO (Data Transfer Object)

#### 風格重點

- 使用 `@nestjs/swagger` 的 `@ApiProperty` 和 `@ApiPropertyOptional` 裝飾器提供 API 文件說明
- 搭配 `class-validator` 裝飾器（如 `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@MaxLength()`）進行資料驗證
- `Create*Dto` 用於創建資源，所有必填屬性應明確標示
- `Update*Dto` 繼承 `PartialType(Create*Dto)`，使得所有屬性變為可選，用於更新資源
- 屬性命名應清晰表達其用途
- **關聯物件處理**：在 `Create` 和 `Update` DTO 中，對於關聯的資源（例如 `Dataset`），應以嵌套物件的形式表示，且僅包含其唯一識別符（例如 `id`）。這有助於保持 DTO 的簡潔性，並明確表示關聯關係，並使用 `@ValidateNested()` 和 `@Type(() => NestedDto)` 進行驗證和轉換
- **必填與可選欄位明確定義**：
  - 必填欄位：使用 `@ApiProperty`、`@IsNotEmpty()` 或相應的驗證器、型別標註使用 `!`（如 `type!: DemandType`）
  - 可選欄位：使用 `@ApiPropertyOptional`、`@IsOptional()`、型別標註使用 `?`（如 `remark?: string`）
  - 避免混用，確保裝飾器、驗證器、型別標註三者一致
- **日期欄位處理**：統一使用 `@IsDate()` 驗證器和 `Date` 型別，搭配 `@Type(() => Date)` 進行轉換，不使用 `@IsISO8601()` 和 `string` 型別

#### 基本範例

```typescript
// src/dataset-key/dto/create-dataset-key.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDatasetKeyDto {
  @ApiProperty({ description: '密鑰名稱', example: 'API_KEY_EXAMPLE' })
  @IsString()
  @IsNotEmpty()
  name!: string; // ✅ 必填欄位：使用 @ApiProperty + @IsNotEmpty + !

  @ApiProperty({
    description: '密鑰，用於程式內部識別',
    example: 'test_key_example',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiPropertyOptional({
    description: '密鑰描述',
    example: '用於測試環境的 API 密鑰',
  })
  @IsString()
  @IsOptional()
  description?: string; // ✅ 可選欄位：使用 @ApiPropertyOptional + @IsOptional + ?

  @ApiPropertyOptional({
    description: '生效日期',
    example: new Date(),
  })
  @IsDate() // ✅ 日期驗證：使用 @IsDate 而非 @IsISO8601
  @IsOptional()
  @Type(() => Date) // ✅ 日期轉換：必須加上 @Type(() => Date)
  effectiveDate?: Date; // ✅ 日期型別：使用 Date 而非 string
}

// src/dataset-key/dto/update-dataset-key.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDatasetKeyDto } from './create-dataset-key.dto';

export class UpdateDatasetKeyDto extends PartialType(CreateDatasetKeyDto) {}
```

#### Query DTO 規範

Query DTO 用於處理查詢參數，應遵循以下規範：

##### 分頁參數

所有需要分頁的 Query DTO 應繼承 `PaginationQueryDto`，避免重複定義 `page` 和 `limit` 欄位。

```typescript
// ✅ 正確：繼承 PaginationQueryDto
import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';

export class FindAllQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '關鍵字搜尋：名稱' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// ❌ 錯誤：自行定義分頁參數
export class FindAllQueryDto {
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}
```

##### 關鍵字搜尋

使用通用的 `keyword` 欄位進行關鍵字搜尋，而不是針對特定欄位的名稱（如 `applicant`、`name` 等）。在 Service 層使用 `$PrismaWhereInput.whereKeywordInput` 處理關鍵字搜尋邏輯。

```typescript
// ✅ 正確：使用 keyword 欄位
@ApiPropertyOptional({ description: '關鍵字搜尋：名稱' })
@IsOptional()
@IsString()
keyword?: string;

// 在 Service 中使用
const whereOR: Prisma.DemandWhereInput[] = [];
if (keyword?.length) {
  const keywordWhere = $PrismaWhereInput.whereKeywordInput<Prisma.DemandWhereInput>(
    ['applicant', 'name'], // 定義要搜尋的欄位
    keyword,
  );
  $PrismaWhereInput.mergeWhereInput(whereOR, {
    OR: [...keywordWhere],
  });
}

// ❌ 錯誤：針對特定欄位命名
@ApiPropertyOptional({ description: '申請人名稱（模糊搜尋）' })
@IsString()
@IsOptional()
applicant?: string;
```

##### 日期欄位

日期欄位應使用 `@IsDate()` 驗證器和 `Date` 類型，而不是 `@IsISO8601()` 和 `string` 類型。

```typescript
// ✅ 正確：使用 Date 類型
@ApiPropertyOptional({ description: '申請日期起始（含）' })
@IsDate()
@IsOptional()
startDate?: Date;

// ❌ 錯誤：使用 string 類型
@ApiPropertyOptional({
  description: '申請日期起始（含）',
  example: '2025-01-01T00:00:00Z'
})
@IsISO8601()
@IsOptional()
startDate?: string;
```

##### Swagger 範例值

Enum 類型的欄位，若無預設值或特定範例需求，`example` 應設為 `null`，避免誤導使用者。

```typescript
// ✅ 正確：example 設為 null
@ApiPropertyOptional({
  description: '需求狀態',
  enum: DemandStatus,
  example: null,
})
@IsEnum(DemandStatus)
@IsOptional()
status?: DemandStatus;

// ❌ 避免：指定特定的 example 值（除非有特定需求）
@ApiPropertyOptional({
  description: '需求狀態',
  enum: DemandStatus,
  example: DemandStatus.PENDING_REVIEW,
})
@IsEnum(DemandStatus)
@IsOptional()
status?: DemandStatus;
```

##### 動態排序參數

Query DTO 應支援動態排序功能，使用通用的 `orderBy` 欄位，格式為 `field:asc|desc`，多個欄位用逗號分隔。

```typescript
// ✅ 正確：使用 orderBy 欄位
@ApiPropertyOptional({
  example: 'id:desc',
  description: '排序; 欄位:desc|asc，兩個欄位以上用,分隔',
})
@IsOptional()
@IsString()
orderBy?: string;

// 在 Service 中使用
const defaultOrderBy: Prisma.DemandOrderByWithRelationInput[] =
  orderBy !== undefined
    ? $PrismaOrderByInput.queryOrderBy<Prisma.DemandOrderByWithRelationInput>(
        orderBy,
      )
    : [{ id: 'desc' }];

// 在查詢中使用
const { result, ...meta } = await this.prisma.demand.pagination({
  page,
  limit,
  where: { ...where, ...this.where },
  orderBy: defaultOrderBy, // ✅ 使用動態排序
  include: this.include,
});

// ❌ 錯誤：固定排序
const { result, ...meta } = await this.prisma.demand.pagination({
  page,
  limit,
  where: { ...where, ...this.where },
  orderBy: { id: 'desc' }, // ❌ 寫死排序方式
  include: this.include,
});
```

##### ID 陣列篩選參數

Query DTO 中涉及 ID 陣列篩選的參數（如 `ids`、`propertyIds`），應統一使用 `@IntIdsQuery` 裝飾器，避免手動定義驗證器和轉換器。

**命名規範：**

- 主資源的 ID 陣列：使用 `ids`（複數形式）
- 關聯資源的 ID 陣列：使用 `{資源名稱}Ids`（如 `propertyIds`、`userIds`）
- 避免使用單數形式（如 `propertyId`）表示陣列參數

**DTO 定義：**

```typescript
import { IntIdsQuery } from 'src/_libs/api-request/query.decorator';
import { entityName } from 'src/demand/demand.interface';

export class FindAllQueryDto extends PaginationQueryDto {
  // ✅ 正確：使用 @IntIdsQuery 裝飾器
  @IntIdsQuery(entityName) // 主資源 ID 陣列
  ids?: number[];

  @IntIdsQuery('資產') // 關聯資源 ID 陣列，傳入資源中文名稱
  propertyIds?: number[];

  // ❌ 錯誤：手動定義驗證器
  @ApiPropertyOptional({
    description: '資產 ID',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  propertyId?: number; // ❌ 單數形式，且手動定義驗證
}
```

**Service 層處理：**

在 Service 的 `findAll` 方法中，應使用 `?.length` 檢查陣列是否有內容，並使用 Prisma 的 `in` 操作符進行批量篩選。

```typescript
async findAll(query: FindAllQueryDto) {
  const { ids, propertyIds, keyword } = query;
  const where: Prisma.DemandWhereInput = {};

  // ✅ 正確：檢查陣列長度並使用 in 操作符
  if (ids?.length) where.id = { in: ids };
  if (propertyIds?.length) where.propertyId = { in: propertyIds };

  // ❌ 錯誤：單一值篩選（舊做法）
  if (propertyId !== undefined) where.propertyId = propertyId;

  // ❌ 錯誤：未檢查陣列長度
  if (ids) where.id = { in: ids }; // 可能傳遞空陣列給 Prisma

  // ... 其他查詢邏輯
}
```

**重點說明：**

1. **統一裝飾器**：`@IntIdsQuery` 內部已處理 API 文檔、驗證器和類型轉換，無需手動定義
2. **命名一致性**：陣列參數統一使用複數形式（`ids`、`propertyIds`）
3. **陣列檢查**：使用 `?.length` 避免空陣列傳遞給 Prisma（空陣列會導致查詢結果為空）
4. **批量查詢**：使用 `{ in: ids }` 語法支援多個 ID 的批量篩選
5. **參數命名**：`@IntIdsQuery` 的參數應傳入資源的中文名稱，用於 API 文檔說明（例如 `@IntIdsQuery('資產')` 會生成「資產 IDs」的描述）

---

#### 關聯資源處理詳細範例

當 DTO 需要關聯其他資源時（例如 Demand 關聯 Property），應遵循以下規範：

**❌ 錯誤做法：直接使用外鍵 ID**

```typescript
export class CreateDemandDto {
  @ApiProperty({ description: '資產 ID' })
  @IsNotEmpty()
  propertyId!: number; // ❌ 不應直接使用扁平的 ID 欄位

  @ApiProperty({ description: '申請人' })
  @IsString()
  applicant!: string;
}
```

**✅ 正確做法：使用嵌套物件**

```typescript
// 1. 定義關聯資源的嵌套 DTO（命名規範：{Operation}{Parent}{Resource}Dto）
class CreateDemandPropertyDto {
  @ApiProperty({ description: '資產 ID', example: 1 })
  @IsNotEmpty()
  @IsInt() // ✅ 使用 @IsInt() 而非 @IsPositive()（更精確的驗證）
  id!: number;
}

// 2. 在 Create/Update DTO 中使用嵌套物件
export class CreateDemandDto {
  @ApiProperty({
    description: '所屬資產',
    type: CreateDemandPropertyDto,
  })
  @IsNotEmptyObject() // ✅ 驗證物件不為空
  @IsObject() // ✅ 驗證是物件型別
  @ValidateNested()
  @Type(() => CreateDemandPropertyDto)
  property!: CreateDemandPropertyDto; // ✅ 使用嵌套物件

  @ApiProperty({ description: '申請人', example: '台北市政府' })
  @IsString()
  @IsNotEmpty()
  applicant!: string;
}
```

**重點說明：**

1. **嵌套 DTO 命名規範**：使用 `{Operation}{Parent}{Resource}Dto` 格式（如 `CreateDemandPropertyDto`），而非通用的 `PropertyIdDto`。這樣能更明確地表達 DTO 的用途和所屬上下文
2. **嵌套物件命名**：使用完整的資源名稱（如 `property`），而非 `propertyId`
3. **驗證裝飾器**：
   - 必須使用 `@ValidateNested()` 和 `@Type(() => NestedDto)`
   - 對於物件型別，應加上 `@IsNotEmptyObject()` 和 `@IsObject()` 增強驗證
   - 對於 ID 欄位，優先使用 `@IsInt()` 而非 `@IsPositive()`（除非有特別需要驗證正數）
4. **Swagger 文檔**：在 `@ApiProperty` 中指定 `type` 為嵌套 DTO
5. **範例值**：可選擇性地提供完整的物件範例（如 `example: { id: 1 }`）

**請求範例：**

```json
{
  "property": {
    "id": 1
  },
  "applicant": "台北市政府"
}
```

---

### 7.2 Entity

#### 風格重點

- 實作 Prisma Client 自動生成的 Interface
- 所有公開屬性皆加上 `@ApiProperty` 或 `@ApiPropertyOptional` 提供 Swagger 文件說明，並加上 `@Expose()` 確保 `class-transformer` 正確轉換
- **Nullable 欄位明確標記**：
  - 當屬性為可為 `null` 的類型時，必須使用 `@ApiPropertyOptional`（而非 `@ApiProperty`）
  - 必須明確指定 `type` 參數（如 `type: String`、`type: Number`）
  - 必須明確指定 `nullable: true`
  - 型別標註使用聯合型別（如 `desiredFloors!: string | null`）
- 屬性使用 `!` 強制斷言，表示該屬性在實例化後一定會有值，符合資料庫模型
- `createdAt` 和 `updatedAt` 使用 `Date` 類型，並應配合資料庫的時區設定
- **API 響應實體**：所有 API 響應應統一返回 Entity 實例（或 `ResourceListEntity` 包含 Entity 陣列）。Entity 應利用 `class-transformer` 的 `@Expose()` 和 `@Exclude()` 裝飾器精確控制哪些屬性會被序列化並呈現在 API 響應中，包括嵌套的關聯 Entity
- **關聯 Entity 嵌套**：當 Entity 包含關聯 Entity 時（例如 `DatasetKeyEntity` 中的 `dataset`），應使用 `@Type(() => RelatedEntity)` 和 `@Expose()` 裝飾器確保正確的類型轉換和序列化

#### 基本範例

```typescript
// src/dataset-key/entities/dataset-key.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DatasetKey, DatasetKeyStatus } from '@prisma/client';

@Exclude()
export class DatasetKeyEntity implements DatasetKey {
  @ApiProperty({ description: '主鍵 ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: '創建時間', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: '更新時間', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ description: '所屬資料集 ID', example: 1 })
  @Expose()
  datasetId!: number | null;

  @ApiProperty({ description: '密鑰名稱', example: '颱風' })
  @Expose()
  name!: string;

  @ApiProperty({
    description: '密鑰，用於程式內部識別',
    example: 'API_KEY_EXAMPLE',
  })
  @Expose()
  key!: string;

  @ApiPropertyOptional({
    description: '資料類型',
    example: 'string',
    type: String, // ✅ nullable 欄位必須明確指定 type
    nullable: true, // ✅ nullable 欄位必須明確指定 nullable: true
  })
  @Expose()
  dataType!: string | null; // ✅ 型別標註使用聯合型別

  @ApiPropertyOptional({
    description: '密鑰描述',
    example: '這是一個測試資料集的描述',
    type: String,
    nullable: true,
  })
  @Expose()
  description!: string | null;

  @ApiPropertyOptional({
    description: '密鑰預設值',
    example: 'default_value',
    type: String,
    nullable: true,
  })
  @Expose()
  defaultValue!: string | null;

  @ApiProperty({ description: '是否必填', example: true })
  @Expose()
  isRequired!: boolean;

  @ApiProperty({ description: '是否全域', example: false })
  @Expose()
  isGlobal!: boolean;

  @ApiProperty({
    description: '狀態',
    enum: DatasetKeyStatus,
    example: DatasetKeyStatus.ENABLE,
  })
  @Expose()
  status!: DatasetKeyStatus;

  deletedAt!: Date | null;
}
```

#### 關聯 Entity 的回傳處理規範

當 Entity 需要包含關聯資源（如 `PropertyEntity` 關聯 `PropertyUsageZoneEntity` 和 `PropertyUsageCategoryEntity`）時，必須遵循以下完整的處理流程：

**Entity 層 - 定義關聯欄位**

使用以下裝飾器組合定義關聯欄位：

```typescript
// src/property/entities/property.entity.ts
@ApiPropertyOptional({
  description: '資產使用分區',
  type: () => PropertyUsageZoneEntity,
})
@Expose()
@Type(() => PropertyUsageZoneEntity)
propertyUsageZone!: PropertyUsageZone;

@ApiPropertyOptional({
  description: '資產使用類型',
  type: () => PropertyUsageCategoryEntity,
})
@Expose()
@Type(() => PropertyUsageCategoryEntity)
propertyUsageCategory!: PropertyUsageCategory;
```

**關鍵要點：**

- 使用 `@ApiPropertyOptional` 而非 `@ApiProperty`（因為關聯可能為 null）
- 必須使用 `type: () => EntityClass` 的函數形式（延遲載入，避免循環依賴問題）
- 必須加上 `@Expose()` 裝飾器（允許該欄位在序列化時被包含）
- 必須加上 `@Type(() => EntityClass)` 裝飾器（確保 `plainToInstance` 轉換時正確地實例化關聯 Entity）
- 類型標註使用 Prisma 生成的類型（如 `PropertyUsageZone`）

---

### 7.3 Interface

```typescript
// src/dataset/dataset.interface.ts
export const entityName = 'Dataset';
```

---

### 7.4 Service

#### 風格重點

- **方法順序**：先 Write（create、update、remove、softDelete），再 Read（findAll、findOne），最後 Support Methods（findOrThrow）
- **錯誤處理**：DB 操作皆包裝於 try-catch 或 `.catch(catchPrismaErrorOrThrow)`
- **查詢支援**：查詢支援 `where.OR` 關鍵字模糊搜尋與分頁，回傳資料皆經 Entity/DTO 轉換
- **職責分離**：Service 只負責業務邏輯，Controller 不可有 DB 操作
- **類型明確**：參數型別明確，回傳型別建議用 Entity/DTO
- **軟刪除模式**：應用程序應實施軟刪除機制（通過 `deletedAt` 字段），並在所有讀取操作中默認過濾掉已軟刪除的記錄（例如 `private readonly where = { deletedAt: null }`）
- **動態篩選與分頁**：在 `findAll` 等查詢方法中，應支持基於 DTO 的動態篩選條件（如 `keyword` 模糊搜索，`isGlobal`，`status`），並利用 Prisma 的 `pagination` 方法進行分頁處理
- **動態排序**：`findAll` 方法應支援動態排序功能，使用 `$PrismaOrderByInput.queryOrderBy` 處理 Query DTO 中的 `orderBy` 參數。若未提供 `orderBy` 參數，應使用預設排序（通常為 `[{ id: 'desc' }]`）
- **Prisma 事務管理**：對於涉及多個數據庫操作的寫入操作（如 `create` 和 `update`），應使用 `this.prisma.$transaction` 確保操作的原子性和數據一致性
- **數據模型轉換**：Service 層應負責將 Prisma 返回的原始數據模型（ORM 對象）通過 `plainToInstance` 統一轉換為定義的 Entity 實例，以提供一致的數據結構
- **統一錯誤處理**：所有服務方法應使用統一的錯誤處理機制，例如 `catchPrismaErrorOrThrow` 捕獲 Prisma 相關錯誤，並在資源未找到時拋出 `HttpException` (如 `findOrThrow` 方法所示)
- **職責範圍**：Service 層應專注於業務邏輯的實現、數據庫操作協調和錯誤處理，不應直接處理 HTTP 請求或響應
- **日期範圍篩選統一處理**：使用 `$PrismaSingleDateTimeWhereInput.singleDateTimeInput` 工具函數處理日期範圍篩選，避免手動構建 `gte`/`lte` 條件。工具函數內部已處理時區轉換和邊界計算，確保日期篩選邏輯的一致性

#### 範例

```typescript
// src/dataset-key/dataset-key.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { catchPrismaErrorOrThrow } from 'src/_libs/prisma/prisma-client-error';
import { $PrismaOrderByInput } from 'src/libs/prisma/order-by-input';
import { entityName } from './dataset-key.interface';
import { CreateDatasetKeyDto } from './dto/create-dataset-key.dto';
import { UpdateDatasetKeyDto } from './dto/update-dataset-key.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { DatasetKeyEntity } from './entities/dataset-key.entity';

@Injectable()
export class DatasetKeyService {
  private readonly where: Prisma.DatasetKeyWhereInput = {
    deletedAt: null,
  };
  private readonly include = {};

  constructor(private readonly prisma: PrismaService) {}

  // **********
  // Write
  // **********
  async create(dto: CreateDatasetKeyDto) {
    const { ...datasetKeyData } = dto;
    const data: Prisma.DatasetKeyCreateInput = {
      ...datasetKeyData,
    };
    const orm = await this.prisma
      .$transaction(async (tx) => {
        return await tx.datasetKey.create({
          data,
          include: this.include,
        });
      })
      .catch(catchPrismaErrorOrThrow(entityName));

    return plainToInstance(DatasetKeyEntity, orm);
  }

  async update(id: number, dto: UpdateDatasetKeyDto) {
    const { ...datasetKeyData } = dto;
    const data: Prisma.DatasetKeyUpdateInput = {
      ...datasetKeyData,
    };
    const orm = await this.prisma
      .$transaction(async (tx) => {
        return await tx.datasetKey.update({
          where: { id },
          data,
          include: this.include,
        });
      })
      .catch(catchPrismaErrorOrThrow(entityName));

    return plainToInstance(DatasetKeyEntity, orm);
  }

  async remove(id: number) {
    await this.findOrThrow(id);
    await this.prisma.datasetKey
      .delete({ where: { id } })
      .catch(catchPrismaErrorOrThrow(entityName));
  }

  async softDelete(id: number) {
    await this.findOrThrow(id);
    return await this.prisma.datasetKey
      .softDelete({ where: { id } })
      .catch(catchPrismaErrorOrThrow(entityName));
  }

  // **********
  // Read
  // **********
  async findAll(query: FindAllQueryDto) {
    const { keyword, orderBy, startDate, endDate } = query;

    // 處理動態排序
    const defaultOrderBy: Prisma.DatasetKeyOrderByWithRelationInput[] =
      orderBy !== undefined
        ? $PrismaOrderByInput.queryOrderBy<Prisma.DatasetKeyOrderByWithRelationInput>(
            orderBy,
          )
        : [{ id: 'desc' }];

    const where: Prisma.DatasetKeyWhereInput = {};

    // 關鍵字搜尋
    const whereOR: Prisma.DatasetKeyWhereInput[] = [];
    if (keyword?.length) {
      whereOR.push({
        name: { contains: keyword, mode: 'insensitive' },
      });
    }
    if (whereOR.length) where.OR = whereOR;

    // ✅ 正確：使用工具函數處理日期範圍篩選
    const dateWhere =
      $PrismaSingleDateTimeWhereInput.singleDateTimeInput<Prisma.DatasetKeyWhereInput>(
        'createdAt',
        startDate,
        endDate,
      );
    if (dateWhere) where.AND = [dateWhere];

    const { page, limit } = query;
    const { result, ...meta } = await this.prisma.datasetKey.pagination({
      page,
      limit,
      where: { ...where, ...this.where },
      orderBy: defaultOrderBy,
      include: this.include,
    });
    return {
      data: plainToInstance(DatasetKeyEntity, result),
      meta,
    };
  }

  async findOne(id: number) {
    const orm = await this.findOrThrow(id);
    return plainToInstance(DatasetKeyEntity, orm);
  }

  // **********
  // Support Methods
  // **********

  protected async findOrThrow(id: number) {
    const orm = await this.prisma.datasetKey.findFirst({
      where: { id, ...this.where },
      include: this.include,
    });
    if (!orm) {
      const response = `無此${entityName}(id: ${id})`;
      throw new HttpException(response, HttpStatus.NOT_FOUND);
    }
    return orm;
  }
}
```

#### 日期範圍篩選對比範例

以下展示日期範圍篩選的錯誤做法與正確做法：

**❌ 錯誤做法：手動構建日期篩選條件**

```typescript
async findAll(query: FindAllQueryDto) {
  const { startDate, endDate } = query;
  const where: Prisma.DemandWhereInput = {};

  // ❌ 不要手動構建 gte/lte 條件
  if (startDate || endDate) {
    where.applicationDate = {};
    if (startDate) {
      where.applicationDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.applicationDate.lte = new Date(endDate);
    }
  }

  // ... 其他查詢邏輯
}
```

**問題點：**

- 每個 Service 都需要重複撰寫相同的日期處理邏輯
- 時區轉換不統一，容易產生不一致的結果
- 直接修改 `where` 的巢狀屬性，結構不清晰
- 未考慮 dayjs 的時區處理機制

**✅ 正確做法：使用工具函數**

```typescript
import { $PrismaSingleDateTimeWhereInput } from 'src/libs/prisma/single-datetime-where-input';

async findAll(query: FindAllQueryDto) {
  const { startDate, endDate } = query;
  const where: Prisma.DemandWhereInput = {};

  // ✅ 使用工具函數處理日期範圍篩選
  const applicationDateWhere =
    $PrismaSingleDateTimeWhereInput.singleDateTimeInput<Prisma.DemandWhereInput>(
      'applicationDate',
      startDate,
      endDate,
    );
  if (applicationDateWhere) where.AND = [applicationDateWhere];

  // ... 其他查詢邏輯
}
```

**優點：**

- 封裝重複邏輯，減少代碼重複
- 工具函數內部使用 dayjs 統一處理時區轉換
- 使用 `where.AND` 結構更清晰
- 自動處理 `undefined`/`null` 的情況
- 確保所有日期篩選行為一致

---

### 7.5 Data Aggregator

#### 風格重點

- 主要負責資料的聚合、轉換或預處理邏輯，確保回傳資料格式的一致性
- 利用 `class-transformer` 的 `plainToInstance` 將 Plain Object 轉換為 Entity 實例
- `aggregate` 方法應處理單一 Entity 或 Entity 陣列的轉換
- 支援多載（overload）定義，提供更嚴謹的類型檢查
- **職責範圍**：Data Aggregator 應嚴格專注於資料的聚合、轉換和預處理，確保回傳資料格式的一致性，不應包含任何業務邏輯

#### 範例

```typescript
// src/dataset-key/dataset-key.data-aggregator.ts
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import head from 'lodash/head';
import { DatasetKeyEntity } from './entities/dataset-key.entity';

type EntityClass = DatasetKeyEntity;
const EntityClass = DatasetKeyEntity;

type ResultType = EntityClass;

@Injectable()
export class DatasetKeyDataAggregator {
  constructor() {}

  toEntity(input: object[]): EntityClass[];
  toEntity(input: object): EntityClass;
  toEntity(input: object | null): EntityClass | null;
  toEntity(input: any): any {
    return plainToInstance(EntityClass, input);
  }

  aggregate(input: EntityClass): Promise<EntityClass>;
  aggregate(input: EntityClass[]): Promise<EntityClass[]>;
  async aggregate(
    input: EntityClass | EntityClass[],
  ): Promise<EntityClass | EntityClass[]> {
    const data = Array.isArray(input) ? input : [input];

    const result: ResultType[] = data.map((entry) => {
      const entity = new EntityClass();
      Object.assign(entity, {
        ...entry,
      });
      return entity;
    });
    return this.toEntity(Array.isArray(input) ? result : head(result)!);
  }
}
```

---

### 7.6 Controller

#### 風格重點

- **方法順序**：先 Write（create、update、remove），再 Read（findAll、findOne）
- **Swagger 裝飾器**：每個方法都要有 `@ApiOperation`、`@ApiOkResponse` 或 `@ApiDataListResponse`
- **參數管道**：路由參數應使用 NestJS 內建的參數管道（例如 `ParseIntPipe`）進行類型轉換和驗證
- **明確的 HTTP 狀態碼**：對於沒有內容返回的成功操作（例如刪除），應使用 `@HttpCode(HttpStatus.NO_CONTENT)` 裝飾器明確指定 HTTP 204 狀態碼
- **Data Aggregator 的統一處理**：Controller 層應始終通過 Data Aggregator 處理 Service 層返回的資料，以確保 API 響應格式的一致性
- **分層清楚**：Controller 只負責請求/回應，業務邏輯全部交給 Service
- **API 文檔**：應全面使用 `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiDataListResponse` 等 Swagger 裝飾器，確保 API 文檔的完整性和自動生成
- **職責範圍**：Controller 應嚴格專注於請求處理和響應返回，所有業務邏輯應委託給 Service 層
- **註解與分區**：用 `// **********` 分隔 Write/Read 區塊，提升可讀性

#### 範例

```typescript
// src/dataset-key/dataset-key.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { entityName } from './dataset-key.interface';
import { DatasetKeyService } from './dataset-key.service';
import { CreateDatasetKeyDto } from './dto/create-dataset-key.dto';
import { UpdateDatasetKeyDto } from './dto/update-dataset-key.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { DatasetKeyEntity } from './entities/dataset-key.entity';
import { DatasetKeyDataAggregator } from './dataset-key.data-aggregator';

@ApiTags(`${entityName}`)
@Controller('dataset-key')
export class DatasetKeyController {
  constructor(
    private readonly datasetKeyService: DatasetKeyService,
    private readonly datasetKeyDataAggregator: DatasetKeyDataAggregator,
  ) {}

  // **********
  // Write
  // **********

  @ApiOperation({ summary: `建立${entityName}` })
  @ApiOkResponse({ type: DatasetKeyEntity })
  @Post()
  async create(@Body() dto: CreateDatasetKeyDto) {
    return this.datasetKeyDataAggregator.aggregate(
      await this.datasetKeyService.create(dto),
    );
  }

  @ApiOperation({ summary: `修改${entityName}` })
  @ApiOkResponse({ type: DatasetKeyEntity })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDatasetKeyDto,
  ) {
    return this.datasetKeyDataAggregator.aggregate(
      await this.datasetKeyService.update(id, dto),
    );
  }

  @ApiOperation({ summary: `刪除${entityName}` })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.datasetKeyService.softDelete(id);
  }

  // **********
  // Read
  // **********

  @ApiOperation({ summary: `取得所有${entityName}` })
  @ApiDataListResponse(DatasetKeyEntity, { hasMeta: true })
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { data, meta } = await this.datasetKeyService.findAll(query);
    return new ResourceListEntity(
      await this.datasetKeyDataAggregator.aggregate(data),
      meta,
    );
  }

  @ApiOperation({ summary: `取得單一${entityName}` })
  @ApiOkResponse({ type: DatasetKeyEntity })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const orm = await this.datasetKeyService.findOne(id);
    return await this.datasetKeyDataAggregator.aggregate(orm);
  }
}
```

---

## 8. 其他自訂規範

> 請依照各功能模組需求，於本區補充專案特有的 code style 或最佳實踐。

---
