import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IssueKind } from '../enums/issue-kind.enum';

export class UpdateIssueDto {
  @IsOptional()
  @IsEnum(IssueKind)
  kind?: IssueKind;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partCategoryId?: number;
}
