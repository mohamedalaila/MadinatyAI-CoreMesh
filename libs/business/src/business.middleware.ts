import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '@madinatyai/prisma';

/**
 * Tenants that support business sub-tenancy (sub-subdomain resolution).
 * e.g. ali.kitchen.madinatyai.com → subdomain=kitchen, businessSlug=ali
 */
const BUSINESS_ENABLED_SUBDOMAINS = new Set(['kitchen', 'tutor']);

/**
 * Resolves a business slug from a sub-subdomain and attaches it to the
 * existing TenantContext. Runs AFTER TenantMiddleware so the tenant is
 * already resolved.
 *
 * Routing pattern: {businessSlug}.{tenantSubdomain}.{rootDomain}
 * Example: ali.kitchen.madinatyai.com → businessSlug=ali, subdomain=kitchen
 */
@Injectable()
export class BusinessMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const ctx = this.tenantContext.get();
    if (!ctx) {
      // No tenant context — skip, TenantGuard will reject anyway.
      return next();
    }

    // Only attempt business resolution for supported tenants.
    if (!BUSINESS_ENABLED_SUBDOMAINS.has(ctx.subdomain)) {
      return next();
    }

    // Also check x-business-slug header as an alternative to sub-subdomain.
    const headerSlug = req.headers['x-business-slug'] as string | undefined;
    if (headerSlug) {
      ctx.businessSlug = headerSlug;
      // businessId will be resolved lazily by the service on first query.
      return next();
    }

    // Try to extract business slug from host: {slug}.{subdomain}.{domain}
    const host = req.hostname;
    const rootDomain = process.env.ROOT_DOMAIN ?? 'madinatyai.com';
    const suffix = `.${ctx.subdomain}.${rootDomain}`;

    if (host.endsWith(suffix) && host !== `${ctx.subdomain}.${rootDomain}`) {
      const slug = host.slice(0, host.length - suffix.length);
      if (slug.length > 0 && /^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        ctx.businessSlug = slug;
      }
    }

    next();
  }
}
