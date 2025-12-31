import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IssueKind } from '../enums/issue-kind.enum';

export class CreateIssueDto {
  @IsEnum(IssueKind)
  kind: IssueKind;

  @IsString()
  @MaxLength(120)
  label: string;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  durationMinutes: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partCategoryId?: number;
}
