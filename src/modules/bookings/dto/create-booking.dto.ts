import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AssetType } from '../enums/asset-type.enum';
import { BookingStatus } from '../enums/booking-status.enum';

class CreateCustomerDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;
}

class VehicleInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  brandId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brandOther?: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsString()
  vinOrPlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

class PartInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partCategoryId: number;

  @IsString()
  @MaxLength(500)
  description: string;
}

export class CreateBookingDto {
  @IsEnum(AssetType)
  assetType: AssetType;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  createCustomer?: CreateCustomerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleInputDto)
  vehicle?: VehicleInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartInputDto)
  part?: PartInputDto;

  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  commonIssueIds: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  customIssues?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;

  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
