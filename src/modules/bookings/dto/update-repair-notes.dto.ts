import { IsOptional, IsString } from 'class-validator';

export class UpdateRepairNotesDto {
  @IsString()
  @IsOptional()
  repairNotes?: string;
}
