import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for the Contact-Us form.
 * Sends a message from a website visitor to the Souk ElKanto support team via WAHA.
 */
export class ContactUsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;
}
