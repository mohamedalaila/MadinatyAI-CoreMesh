import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Authenticated user submits their own KYC identity document.
 * `userId` is derived from the JWT — never passed in the body.
 */
export class SubmitMyKycDto {
  /** Full name as it appears on the national ID. */
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  fullName!: string;

  /** National ID number (Egyptian رقم قومي). */
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  idNumber!: string;

  /** Base64-encoded ID document photo (JPEG/PNG, max 5 MB recommended). */
  @IsString()
  @MinLength(1)
  documentBase64!: string;
}
