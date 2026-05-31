import { NotFoundException } from '@nestjs/common';

/** Thrown when a business slug or ID cannot be found in the current tenant schema. */
export class BusinessNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Business not found: ${identifier}`);
  }
}
