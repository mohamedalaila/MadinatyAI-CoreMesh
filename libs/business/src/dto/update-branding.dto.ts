import { IsJSON } from 'class-validator';

/** Request to update a business's visual identity. */
export class UpdateBrandingDto {
  @IsJSON()
  branding!: Record<string, unknown>;
}
