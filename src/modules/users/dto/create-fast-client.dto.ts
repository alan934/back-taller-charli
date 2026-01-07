import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateFastClientDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{7,15}$/, { message: 'El número de teléfono debe tener entre 7 y 15 dígitos' })
  phone: string;
}
