import 'reflect-metadata';
import { exportOpenApi } from '@luve/service-kit';
import { service } from './service.js';

await exportOpenApi(service, new URL('../openapi.json', import.meta.url));
