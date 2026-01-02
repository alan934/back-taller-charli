import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { AssetType } from '../enums/asset-type.enum';

export class AvailabilityQueryDto {
  // Expect a plain date string (YYYY-MM-DD) in local time to avoid implicit UTC shifts
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString()
  @Type(() => String)
  date: string;

  @IsEnum(AssetType)
  @Type(() => String)
  assetType: AssetType;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Type(() => Number)
  durationMinutes?: number;
}
