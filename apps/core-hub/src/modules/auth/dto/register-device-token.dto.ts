import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Register (or refresh) an FCM device token for the authenticated user.
 * If the token already exists, it is reactivated and its platform/appSlug updated.
 */
export class RegisterDeviceTokenDto {
  @IsString()
  token!: string;

  @IsIn(['web', 'android', 'ios'])
  platform!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appSlug?: string;
}
