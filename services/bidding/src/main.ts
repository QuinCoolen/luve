import 'reflect-metadata';
import { bootstrapService } from '@luve/service-kit';
import { service } from './service.js';

await bootstrapService(service);
