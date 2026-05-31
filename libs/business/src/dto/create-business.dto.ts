import { IsJSON, IsOptional, IsString, MinLength } from 'class-validator';

/** Request to register a new business within a tenant. */
export class CreateBusinessDto {
  @IsString()
  @MinLength(1)
  ownerGlobalUserId!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsJSON()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsString()
  subjects?: string; // JSON string of string[] for tutor

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  phone?: string;
}
