import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOfferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  reason!: string;
}

export const SoukDisputeReasonValues = [
  'ITEM_NOT_AS_DESCRIBED',
  'ITEM_DEFECTIVE',
  'NO_SHOW',
  'PAYMENT_ISSUE',
  'COUNTERFEIT',
  'SELLER_BACKED_OUT',
  'BUYER_BACKED_OUT',
  'SAFETY_CONCERN',
  'OTHER',
] as const;

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  offerId!: string;

  @IsEnum(SoukDisputeReasonValues)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  evidenceR2Key?: string;
}

export class ResolveDisputeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  resolution!: string;

  @IsOptional()
  fileReport?: boolean;
}

export class RejectDisputeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;
}
