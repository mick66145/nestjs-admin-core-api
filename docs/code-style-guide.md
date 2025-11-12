# 程式碼風格指南

本指南提供本專案的程式碼風格規範，確保所有程式碼的一致性與可讀性。**如有特殊需求，請依功能需求補充自訂規範。**

---

## 1. 通用原則

- 保持程式碼簡潔、清晰、易於理解。
- 遵循一致的命名慣例。
- 避免過深的巢狀結構。
- 善用 TypeScript 類型系統，明確定義類型。
- **API 文件完整性**：所有公共 API 接口（Controller 方法）及其請求/響應數據模型（DTO/Entity）應全面使用 Swagger 裝飾器進行描述，以確保自動生成的 API 文件清晰、完整。
- **清晰的職責分離**：嚴格遵循分層架構，確保每個組件（Controller, Service, DataAggregator 等）只負責其核心功能，避免職責混淆。

---

## 2. 命名慣例

- **變數與函式**：`camelCase`（如：`userName`, `getUserProfile`）
- **類別與介面**：`PascalCase`（如：`UserService`, `UserProfileInterface`）
- **檔案**：`kebab-case`（如：`user-service.ts`, `user-profile.interface.ts`）。
  - **模塊內部組織**：對於 DTOs 和 Entities 等相關文件，應將其組織在模塊內部的專屬子目錄中（例如 `dto/` 和 `entities/`），且檔案命名需與類別名稱對應（如：`dto/create-dataset-key.dto.ts` 對應 `CreateDatasetKeyDto`）。
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

---

## 5. TypeScript 特定規範

- **明確類型聲明**：避免使用 `any`，除非無法避免且經過審慎考量
- **介面與型別別名**：用 `interface` 定義物件結構，`type` 定義複合型別或別名
- **唯讀屬性**：不可變屬性請加 `readonly`

---

## 6. 範例（以 `src/dataset` 模組為例）

### 6.1 DTO (Data Transfer Object)

```typescript
// src/dataset-key/dto/create-dataset-key.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateDatasetKeyDto {
  @ApiProperty({ description: '密鑰名稱', example: 'API_KEY_EXAMPLE' })
  @IsString()
  @IsNotEmpty()
  name!: string;

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
  description?: string;
}

// src/dataset-key/dto/update-dataset-key.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDatasetKeyDto } from './create-dataset-key.dto';

export class UpdateDatasetKeyDto extends PartialType(CreateDatasetKeyDto) {}
```

#### DTO 風格重點

- 使用 `@nestjs/swagger` 的 `@ApiProperty` 和 `@ApiPropertyOptional` 裝飾器提供 API 文件說明。
- 搭配 `class-validator` 裝飾器（如 `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@MaxLength()`）進行資料驗證。
- `Create*Dto` 用於創建資源，所有必填屬性應明確標示。
- `Update*Dto` 繼承 `PartialType(Create*Dto)`，使得所有屬性變為可選，用於更新資源。
- 屬性命名應清晰表達其用途。
- **關聯物件處理**：在 `Create` 和 `Update` DTO 中，對於關聯的資源（例如 `Dataset`），應以嵌套物件的形式表示，且僅包含其唯一識別符（例如 `id`）。這有助於保持 DTO 的簡潔性，並明確表示關聯關係，並使用 `@ValidateNested()` 和 `@Type(() => NestedDto)` 進行驗證和轉換。

### 6.2 Entity

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

  @ApiProperty({ description: '資料類型', example: 'string' })
  @Expose()
  dataType!: string | null;

  @ApiProperty({ description: '密鑰描述', example: '這是一個測試資料集的描述' })
  @Expose()
  description!: string | null;

  @ApiProperty({ description: '密鑰預設值', example: 'default_value' })
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

#### Entity 風格重點

- 實作 Prisma Client 自動生成的 Interface。
- 所有公開屬性皆加上 `@ApiProperty` 提供 Swagger 文件說明，並加上 `@Expose()` 確保 `class-transformer` 正確轉換。
- 當屬性為可為 `null` 的類型時，`@ApiProperty` 應明確指定 `type` 和 `nullable: true`。
- 屬性使用 `!` 強制斷言，表示該屬性在實例化後一定會有值，符合資料庫模型。
- `createdAt` 和 `updatedAt` 使用 `Date` 類型，並應配合資料庫的時區設定。
- **API 響應實體**：所有 API 響應應統一返回 Entity 實例（或 `ResourceListEntity` 包含 Entity 陣列）。Entity 應利用 `class-transformer` 的 `@Expose()` 和 `@Exclude()` 裝飾器精確控制哪些屬性會被序列化並呈現在 API 響應中，包括嵌套的關聯 Entity。
- **關聯 Entity 嵌套**：當 Entity 包含關聯 Entity 時（例如 `DatasetKeyEntity` 中的 `dataset`），應使用 `@Type(() => RelatedEntity)` 和 `@Expose()` 裝飾器確保正確的類型轉換和序列化。

### 6.3 Interface

```typescript
// src/dataset/dataset.interface.ts
export const entityName = 'Dataset';
```

### 6.4 Service

```typescript
// src/dataset-key/dataset-key.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { catchPrismaErrorOrThrow } from 'src/libs/prisma/client-error';
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
    const { keyword } = query;

    const where: Prisma.DatasetKeyWhereInput = {};

    const whereOR: Prisma.DatasetKeyWhereInput[] = [];
    if (keyword?.length) {
      whereOR.push({
        name: { contains: keyword, mode: 'insensitive' },
      });
    }

    if (whereOR.length) where.OR = whereOR;

    const { page, limit } = query;
    const { result, ...meta } = await this.prisma.datasetKey.pagination({
      page,
      limit,
      where: { ...where, ...this.where },
      orderBy: { id: 'desc' },
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

#### Service 風格重點

- 方法順序：先 Write（create、update、remove、softDelete），再 Read（findAll、findOne），最後 Support Methods（findOrThrow）。
- DB 操作皆包裝於 try-catch 或 .catch(catchPrismaErrorOrThrow)。
- 查詢支援 where.OR 關鍵字模糊搜尋與分頁，回傳資料皆經 Entity/DTO 轉換。
- Service 只負責業務邏輯，Controller 不可有 DB 操作。
- 參數型別明確，回傳型別建議用 Entity/DTO。
- 支援軟刪除（softDelete）與 findOrThrow 輔助方法。
- **統一錯誤處理**：所有服務方法應使用統一的錯誤處理機制，例如 `catchPrismaErrorOrThrow` 捕獲 Prisma 相關錯誤，並在資源未找到時拋出 `HttpException` (如 `findOrThrow` 方法所示)。
- **軟刪除模式**：應用程序應實施軟刪除機制（通過 `deletedAt` 字段），並在所有讀取操作中默認過濾掉已軟刪除的記錄（例如 `private readonly where = { deletedAt: null }`）。
- **動態篩選與分頁**：在 `findAll` 等查詢方法中，應支持基於 DTO 的動態篩選條件（如 `keyword` 模糊搜索，`isGlobal`，`status`），並利用 Prisma 的 `pagination` 方法進行分頁處理。
- **Prisma 事務管理**：對於涉及多個數據庫操作的寫入操作（如 `create` 和 `update`），應使用 `this.prisma.$transaction` 確保操作的原子性和數據一致性。
- **數據模型轉換**：Service 層應負責將 Prisma 返回的原始數據模型（ORM 對象）通過 `plainToInstance` 統一轉換為定義的 Entity 實例，以提供一致的數據結構。
- **職責範圍**：Service 層應專注於業務邏輯的實現、數據庫操作協調和錯誤處理，不應直接處理 HTTP 請求或響應。

### 6.5 Data Aggregator

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

#### Data Aggregator 風格重點

- 主要負責資料的聚合、轉換或預處理邏輯，確保回傳資料格式的一致性。
- 利用 `class-transformer` 的 `plainToInstance` 將 Plain Object 轉換為 Entity 實例。
- `aggregate` 方法應處理單一 Entity 或 Entity 陣列的轉換。
- 支援多載（overload）定義，提供更嚴謹的類型檢查。
- **職責範圍**：Data Aggregator 應嚴格專注於資料的聚合、轉換和預處理，確保回傳資料格式的一致性，不應包含任何業務邏輯。

### 6.6 Controller

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

#### Controller 風格重點

- 方法順序：先 Write（create、update、remove），再 Read（findAll、findOne）。
- Swagger 裝飾器：每個方法都要有 @ApiOperation、@ApiOkResponse 或 @ApiDataListResponse。
- **參數管道**：路由參數應使用 NestJS 內建的參數管道（例如 `ParseIntPipe`）進行類型轉換和驗證。
- **明確的 HTTP 狀態碼**：對於沒有內容返回的成功操作（例如刪除），應使用 `@HttpCode(HttpStatus.NO_CONTENT)` 裝飾器明確指定 HTTP 204 狀態碼。
- **Data Aggregator 的統一處理**：Controller 層應始終通過 Data Aggregator 處理 Service 層返回的資料，以確保 API 響應格式的一致性。
- 分層清楚：Controller 只負責請求/回應，業務邏輯全部交給 Service。
- **API 文檔**：應全面使用 `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiDataListResponse` 等 Swagger 裝飾器，確保 API 文檔的完整性和自動生成。
- **職責範圍**：Controller 應嚴格專注於請求處理和響應返回，所有業務邏輯應委託給 Service 層。
- 註解與分區：用 // \***\*\*\*\*\*** 分隔 Write/Read 區塊，提升可讀性。

---

## 7. 關聯資源驗證規範

### 7.1 關聯資源必須先驗證再關聯

在 Service 層處理包含關聯資源（foreign key）的操作時，**必須遵循以下步驟**：

1. **先驗證關聯資源存在**：使用相關服務的 `findOne()` 方法驗證被關聯的資源是否存在
2. **再執行關聯操作**：確認關聯資源存在後，才能在 `Prisma` 操作中使用 `connect` 進行關聯

#### 範例（Property Service）

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

#### 規則重點

- **驗證先行**：永遠不能假設關聯資源存在，必須主動驗證
- **服務注入**：在 Service 的 `constructor` 中注入關聯的服務（如 `PropertyUsageCategoryService`）
- **錯誤處理**：`findOne()` 方法若資源不存在會拋出 `HttpException(NOT_FOUND)`，這會自動傳播至 Controller 並返回 404 錯誤
- **事務保護**：驗證後的操作應包含在 `$transaction` 中，確保數據一致性
- **適用場景**：此規則適用於所有涉及外鍵關聯的 create/update 操作

---

## 8. 其他自訂規範

> 請依照各功能模組需求，於本區補充專案特有的 code style 或最佳實踐。

---
