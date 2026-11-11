import { Global, Module } from '@nestjs/common';
import { PrismaReadinessCheck } from './prisma.readiness.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, PrismaReadinessCheck],
  exports: [PrismaService, PrismaReadinessCheck],
})
export class PrismaModule {}
