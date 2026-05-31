import { ConflictException } from '@nestjs/common';

/** Thrown when a business slug is already taken within the tenant. */
export class DuplicateSlugException extends ConflictException {
  constructor(slug: string) {
    super(`Business slug already exists: ${slug}`);
  }
}
