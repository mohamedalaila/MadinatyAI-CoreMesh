import { Module } from '@nestjs/common';
import { PrismaModule } from '@madinatyai/prisma';
import { BusinessService } from './business.service';

@Module({
  imports: [PrismaModule],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
