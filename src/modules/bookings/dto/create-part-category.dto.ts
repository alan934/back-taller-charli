import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

export class CreatePartCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'code solo puede contener minúsculas, números y guiones',
  })
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
