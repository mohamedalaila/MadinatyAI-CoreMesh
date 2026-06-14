-- Provision the 5 ecosystem tenants the API requires for x-tenant-id resolution.
-- Idempotent (ON CONFLICT) so re-running the migration is safe. Mirrors the
-- TENANTS array in prisma/seed.ts. Without these rows TenantMiddleware refuses
-- every request with "Tenant '<sub>' is not provisioned".
INSERT INTO core."Tenant" (id, subdomain, "schemaName", "tierLevel", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'souq',     'tenant_souq',        'STANDARD', true, NOW(), NOW()),
  (gen_random_uuid(), 'kitchen',  'tenant_kitchen',     'STANDARD', true, NOW(), NOW()),
  (gen_random_uuid(), 'tutor',    'tenant_tutor',       'FREE',     true, NOW(), NOW()),
  (gen_random_uuid(), 'timebank', 'tenant_timebank',    'FREE',     true, NOW(), NOW()),
  (gen_random_uuid(), 'kanto',    'tenant_soukelkanto', 'STANDARD', true, NOW(), NOW())
ON CONFLICT (subdomain) DO NOTHING;
