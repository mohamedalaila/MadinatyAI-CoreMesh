import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JtiDenyListService } from './jti-deny-list.service';

const makePrisma = () => ({
  globalUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
});

const makeJwt = () => ({
  signAsync: jest.fn().mockResolvedValue('signed.jwt.value'),
});

const makeOtp = () => ({
  issue: jest.fn().mockResolvedValue(undefined),
  verify: jest.fn().mockResolvedValue(true),
});

const makeConfig = () => ({
  get: jest.fn((key: string) => (key === 'auth.jwtExpiresIn' ? '7d' : undefined)),
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let otp: ReturnType<typeof makeOtp>;

  beforeEach(async () => {
    prisma = makePrisma();
    otp = makeOtp();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: makeJwt() },
        { provide: OtpService, useValue: otp },
        { provide: ConfigService, useValue: makeConfig() },
        JtiDenyListService,
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates the GlobalUser when absent and issues a REGISTER OTP', async () => {
      prisma.globalUser.findUnique.mockResolvedValue(null);
      prisma.globalUser.create.mockResolvedValue({ id: 'u1' });

      const result = await service.register('+201001234567');

      expect(prisma.globalUser.create).toHaveBeenCalledWith({
        data: { phoneNumber: '+201001234567', role: Role.USER },
      });
      expect(otp.issue).toHaveBeenCalledWith('+201001234567', 'REGISTER');
      expect(result).toEqual({ phoneNumber: '+201001234567' });
    });

    it('skips creation when the user already exists and still issues OTP', async () => {
      prisma.globalUser.findUnique.mockResolvedValue({ id: 'u1' });
      await service.register('+201001234567');
      expect(prisma.globalUser.create).not.toHaveBeenCalled();
      expect(otp.issue).toHaveBeenCalledWith('+201001234567', 'REGISTER');
    });
  });

  describe('login', () => {
    it('rejects unknown phones with 404', async () => {
      prisma.globalUser.findUnique.mockResolvedValue(null);
      await expect(service.login('+20')).rejects.toBeInstanceOf(NotFoundException);
      expect(otp.issue).not.toHaveBeenCalled();
    });

    it('issues a LOGIN OTP for an existing user', async () => {
      prisma.globalUser.findUnique.mockResolvedValue({ id: 'u1' });
      await service.login('+201001234567');
      expect(otp.issue).toHaveBeenCalledWith('+201001234567', 'LOGIN');
    });
  });

  describe('verifyOtp', () => {
    it('returns a token + full profile projection on success', async () => {
      // First call: minimal lookup by phoneNumber (for JWT issuance).
      // Second call: full profile load by id (for the response body).
      prisma.globalUser.findUnique
        .mockResolvedValueOnce({
          id: 'u1',
          phoneNumber: '+201001234567',
          role: Role.USER,
        })
        .mockResolvedValueOnce({
          id: 'u1',
          phoneNumber: '+201001234567',
          role: Role.USER,
          isVerified: true,
          trustScore: 50,
          metadata: { fullName: 'Ahmed Ali', gender: 'MALE' },
          kyc: null,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        });

      const result = await service.verifyOtp('+201001234567', '482915');

      expect(otp.verify).toHaveBeenCalledWith('+201001234567', '482915');
      expect(result.token).toBe('signed.jwt.value');
      // Pre-Phase A — verifyOtp now returns the full profile, not just id/phone/role.
      expect(result.user).toMatchObject({
        id: 'u1',
        phoneNumber: '+201001234567',
        role: Role.USER,
        isVerified: true,
        trustScore: 50,
        fullName: 'Ahmed Ali',
        gender: 'MALE',
        kyc: null,
      });
    });

    it('throws 404 when the user was deleted between register and verify', async () => {
      prisma.globalUser.findUnique.mockResolvedValue(null);
      await expect(service.verifyOtp('+201001234567', '482915')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('me', () => {
    it('returns the full profile projection', async () => {
      prisma.globalUser.findUnique.mockResolvedValue({
        id: 'u1',
        phoneNumber: '+201001234567',
        role: Role.USER,
        isVerified: true,
        trustScore: 80,
        metadata: { fullName: 'Sara Hassan', gender: 'FEMALE', madinatyGroup: 'G1' },
        kyc: { status: 'APPROVED', reviewedAt: new Date('2025-06-01T00:00:00.000Z') },
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      });

      const result = await service.me('u1');

      expect(result).toMatchObject({
        id: 'u1',
        phoneNumber: '+201001234567',
        role: Role.USER,
        isVerified: true,
        trustScore: 80,
        fullName: 'Sara Hassan',
        gender: 'FEMALE',
        madinatyGroup: 'G1',
        kyc: { status: 'APPROVED' },
      });
    });
  });
});
