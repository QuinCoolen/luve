import { ConfigKitModule, HealthKitModule, LoggingModule } from '@luve/service-kit';
import { Module } from '@nestjs/common';
import { envSchema } from './env.js';

@Module({
  imports: [
    ConfigKitModule.forRoot(envSchema),
    LoggingModule.forRoot('auctions'),
    HealthKitModule.forRoot(),
  ],
})
export class AppModule {}
