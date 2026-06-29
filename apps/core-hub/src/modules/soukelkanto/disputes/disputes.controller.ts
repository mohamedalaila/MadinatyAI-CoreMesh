import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { Roles } from '@madinatyai/common';
import { TenantGuard } from '@madinatyai/tenancy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SoukElKantoService } from '../soukelkanto.service';
import {
  CreateDisputeDto,
  RejectDisputeDto,
  ResolveDisputeDto,
} from '../dto/cancel-offer.dto';

@ApiTags('Souk ElKanto — Disputes')
@ApiBearerAuth()
@Controller('disputes')
@UseGuards(TenantGuard)
export class DisputesController {
  constructor(private readonly souk: SoukElKantoService) {}

  @Post()
  @AuditAction({ action: 'souk.dispute.create', target: 'dispute' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisputeDto) {
    return this.souk.createDispute(user.id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.souk.listMyDisputes(user.id);
  }

  // ── Admin resolution endpoints (RolesGuard is global via APP_GUARD) ──

  @Patch(':id/resolve')
  @Roles('ADMIN', 'MODERATOR')
  @AuditAction({ action: 'souk.dispute.resolve', target: 'dispute' })
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.souk.resolveDispute(id, user.id, dto.resolution, dto.fileReport);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'MODERATOR')
  @AuditAction({ action: 'souk.dispute.reject', target: 'dispute' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectDisputeDto,
  ) {
    return this.souk.rejectDispute(id, user.id, dto.reason);
  }
}
