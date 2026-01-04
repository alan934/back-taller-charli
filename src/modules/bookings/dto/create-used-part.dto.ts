import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateUsedPartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
