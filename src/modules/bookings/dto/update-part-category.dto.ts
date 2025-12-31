import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdatePartCategoryDto {
	@IsOptional()
	@IsString()
	@MaxLength(60)
	@Matches(/^[a-z0-9-]+$/, {
		message: 'code solo puede contener minúsculas, números y guiones',
	})
	code?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	name?: string;
}
