import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup.js';

const app = await NestFactory.create(AppModule);
setupApp(app);
await app.listen(4006);
