import { IsOptional, IsString } from 'class-validator';

export class UpdateDetailsDto {
  @IsString()
  @IsOptional()
  details?: string;
}
