import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AssetType } from '../enums/asset-type.enum';

export class AvailabilityQueryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(AssetType)
  @Type(() => String)
  assetType: AssetType;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Type(() => Number)
  durationMinutes?: number;
}
