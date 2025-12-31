import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Matches, Max, Min, ValidateNested } from 'class-validator';

export class WorkdayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxBookings?: number;
}

export class UpsertWorkdaysDto {
  @ValidateNested({ each: true })
  @Type(() => WorkdayDto)
  workdays: WorkdayDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkdayOverrideDto)
  overrides?: WorkdayOverrideDto[];
}

export class WorkdayOverrideDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string; // YYYY-MM-DD

  @IsInt()
  @Min(1)
  maxBookings: number;
}
