import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TenantContextService } from '@madinatyai/prisma';

/**
 * Guard that ensures a business context is present for the current request.
 * Must be used AFTER TenantGuard and BusinessMiddleware have run.
 * Returns 403 if no business slug was resolved from the sub-subdomain or header.
 */
@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.get();
    if (!ctx?.businessSlug) {
      return false;
    }
    return true;
  }
}
