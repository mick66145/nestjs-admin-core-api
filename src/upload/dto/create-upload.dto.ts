import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiPropertyOptional({ description: '路徑' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: '指定檔案名稱' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
