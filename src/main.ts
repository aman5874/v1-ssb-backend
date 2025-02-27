import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import compression from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  // Create HTTPS options for HTTP/2
  const httpsOptions = {
    key: fs.readFileSync(
      path.join(__dirname, '..', 'certs', 'private-key.pem'),
    ),
    cert: fs.readFileSync(
      path.join(__dirname, '..', 'certs', 'public-cert.pem'),
    ),
  };

  // Create Fastify adapter with HTTP/2 support
  const fastifyAdapter = new FastifyAdapter({
    http2: true,
    https: httpsOptions,
    logger: true,
  });

  // Create NestJS application
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      cors: true,
    },
  );

  await app.register(compression, { encodings: ['gzip', 'deflate'] });
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  // Start the server
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Application running on HTTP/2 - ${await app.getUrl()}`);
}
bootstrap();
