import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertPartDto {
  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryOther?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;
}
