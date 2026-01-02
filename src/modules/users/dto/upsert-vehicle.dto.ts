import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

export class UpsertVehicleDto {
  @IsInt()
  typeId: number;

  @IsOptional()
  @IsInt()
  brandId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brandOther?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  model: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  vinOrPlate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
