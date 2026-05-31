import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BusinessService } from '@madinatyai/business';
import { TenantContextService } from '@madinatyai/prisma';
import type {
  CreateBusinessDto,
  UpdateBrandingDto,
  UpdateBusinessProfileDto,
} from '@madinatyai/business';

/**
 * REST API for managing sub-tenant businesses (Kitchen restaurants, Tutor centres).
 * The tenant is resolved from the request context; the business tenant type
 * is inferred from the subdomain (kitchen → KitchenBusiness, tutor → TutorBusiness).
 */
@Controller('business')
export class BusinessController {
  constructor(
    private readonly business: BusinessService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /** Resolve which tenant type to use for business operations. */
  private getTenant(): 'kitchen' | 'tutor' {
    const ctx = this.tenantContext.getOrThrow();
    if (ctx.subdomain === 'kitchen') return 'kitchen';
    if (ctx.subdomain === 'tutor') return 'tutor';
    throw new Error(`Tenant ${ctx.subdomain} does not support business sub-tenancy`);
  }

  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.business.createBusiness(this.getTenant(), dto);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.business.getBusiness(this.getTenant(), slug);
  }

  @Get()
  list(@Query('activeOnly') activeOnly?: string) {
    return this.business.listBusinesses(this.getTenant(), activeOnly !== 'false');
  }

  @Patch(':id/branding')
  updateBranding(@Param('id') id: string, @Body() dto: UpdateBrandingDto) {
    return this.business.updateBranding(this.getTenant(), id, dto);
  }

  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateBusinessProfileDto) {
    return this.business.updateProfile(this.getTenant(), id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  deactivate(@Param('id') id: string) {
    return this.business.deactivateBusiness(this.getTenant(), id);
  }
}
