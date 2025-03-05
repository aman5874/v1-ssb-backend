import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import compression from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import fastify, { FastifyInstance } from 'fastify';
import { Http2SecureServer } from 'http2';

async function bootstrap() {
  // Create a Fastify instance for HTTP/1.1
  const http1App: FastifyInstance = fastify();

  // Create a Fastify instance for HTTP/2 using environment variables for SSL
  const http2App: FastifyInstance<Http2SecureServer> = fastify({
    http2: true,
    https: {
      key: process.env.SSL_KEY, // Use SSL_KEY from environment variables
      cert: process.env.SSL_CERT, // Use SSL_CERT from environment variables
    },
  });

  // Create NestJS applications
  const nestHttp1App = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(http1App),
  );

  const nestHttp2App = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(http2App as any), // Cast to any to bypass type checking
  );

  await nestHttp1App.register(compression, { encodings: ['gzip', 'deflate'] });
  await nestHttp1App.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  await nestHttp2App.register(compression, { encodings: ['gzip', 'deflate'] });
  await nestHttp2App.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  // Start the HTTP/1.1 server
  nestHttp1App.enableCors(); // Enable CORS if needed
  await nestHttp1App.listen(3000, '0.0.0.0'); // HTTP/1.1 on port 3000

  // Start the HTTP/2 server
  nestHttp2App.enableCors(); // Enable CORS if needed
  await nestHttp2App.listen(3443, '0.0.0.0'); // HTTP/2 on port 3443

  console.log('HTTP/1.1 server running on http://localhost:3000');
  console.log('HTTP/2 server running on https://localhost:3443');
}
bootstrap();
