import type { Role } from '@prisma/client';

/**
 * Shape of the authenticated principal hydrated by {@link JwtAuthGuard}
 * onto `request.user`. Downstream guards/decorators read from this contract.
 */
export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  role: Role;
}

/**
 * Full profile projection returned by `/auth/me` and `/auth/verify-otp`.
 *
 * Extends the minimal {@link AuthenticatedUser} with flattened `metadata`
 * fields, KYC status, trust score, and timestamps so clients can hydrate
 * their entire user state from a single response without a follow-up `/me`.
 */
export interface UserProfile extends AuthenticatedUser {
  isVerified: boolean;
  trustScore: number;
  metadata: unknown;
  fullName?: string;
  gender?: string;
  birthdate?: string;
  address?: string;
  madinatyGroup?: string;
  buildingNo?: string;
  aptNo?: string;
  kyc: { status: string; reviewedAt: Date | null } | null;
  createdAt: Date;
}

/**
 * JWT payload contract. Matches what {@link AuthService.issueToken} signs.
 * `sub` is the GlobalUser.id (standard JWT subject claim).
 *
 * R-11 F-16 — `jti` is a server-generated random ID per issuance. Stored in
 * the JTI deny-list on logout so subsequent verifies fail even when the token
 * hasn't expired yet.
 */
export interface JwtPayload {
  sub: string;
  phoneNumber: string;
  role: Role;
  jti?: string;
  iat?: number;
  exp?: number;
}
