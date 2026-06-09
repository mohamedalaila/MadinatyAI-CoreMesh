import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { KycService } from '@madinatyai/kyc';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateUserDto } from './dto/create-user.dto';
import { SubmitMyKycDto } from './dto/submit-my-kyc.dto';

/** Shared identity endpoints (core schema, tenant-agnostic). */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kyc: KycService,
  ) {}

  /**
   * Legacy direct-create endpoint kept Public for compatibility with seed
   * scripts and the existing e2e tests. Real user signup now flows through
   * `POST /auth/register` (phone + OTP) — prefer that.
   */
  @Public()
  @Post()
  @ApiOperation({ summary: '[Legacy] Create a GlobalUser directly. Prefer /auth/register.' })
  create(@Body() dto: CreateUserDto) {
    return this.prisma.globalUser.create({
      data: {
        phoneNumber: dto.phoneNumber,
        role: (dto.role as Role) ?? Role.USER,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /** Authenticated principal's KYC status — drives the verified chip on FE. */
  @Get('me/kyc-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user\'s KYC status' })
  async myKycStatus(@CurrentUser() user: AuthenticatedUser) {
    const kyc = await this.prisma.kycRegistry.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        reviewedAt: true,
        createdAt: true,
      },
    });
    const globalUser = await this.prisma.globalUser.findUnique({
      where: { id: user.id },
      select: { isVerified: true, metadata: true },
    });
    return {
      isVerified: globalUser?.isVerified ?? false,
      status: kyc?.status ?? 'NOT_SUBMITTED',
      submittedAt: kyc?.createdAt ?? null,
      reviewedAt: kyc?.reviewedAt ?? null,
      fullName: (globalUser?.metadata as Record<string, unknown> | undefined)?.fullName as string | undefined,
    };
  }

  /** Submit KYC for the authenticated user (progressive verification). */
  @Post('me/kyc')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit KYC identity document (current user)' })
  async submitMyKyc(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitMyKycDto) {
    const document = Buffer.from(dto.documentBase64, 'base64');

    // Store fullName in user metadata so it persists even if KYC is later rejected.
    await this.prisma.globalUser.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...(await this.prisma.globalUser.findUnique({
            where: { id: user.id },
            select: { metadata: true },
          }))?.metadata as Record<string, unknown>,
          fullName: dto.fullName,
        } as Prisma.InputJsonValue,
      },
    });

    return this.kyc.submit(user.id, dto.idNumber, document);
  }

  @Get(':id')
  @ApiBearerAuth()
  async get(@Param('id') id: string) {
    const user = await this.prisma.globalUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`GlobalUser ${id} not found`);
    }
    return user;
  }

  /** Update the authenticated user's profile metadata. */
  @Patch('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (name, gender, birthdate, address)' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { fullName?: string; gender?: string; birthdate?: string; address?: string; madinatyGroup?: string; buildingNo?: string; aptNo?: string },
  ) {
    const existing = await this.prisma.globalUser.findUnique({
      where: { id: user.id },
      select: { metadata: true },
    });
    const metadata = {
      ...(existing?.metadata as Record<string, unknown> ?? {}),
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.birthdate !== undefined && { birthdate: dto.birthdate }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.madinatyGroup !== undefined && { madinatyGroup: dto.madinatyGroup }),
      ...(dto.buildingNo !== undefined && { buildingNo: dto.buildingNo }),
      ...(dto.aptNo !== undefined && { aptNo: dto.aptNo }),
    };
    const updated = await this.prisma.globalUser.update({
      where: { id: user.id },
      data: { metadata: metadata as Prisma.InputJsonValue },
      select: { id: true, phoneNumber: true, role: true, isVerified: true, trustScore: true, metadata: true, createdAt: true },
    });
    return updated;
  }

}