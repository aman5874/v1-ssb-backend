import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('3000'),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return server status', () => {
      const expectedResponse = 'Server is running on port 3000\nStatus: OK';
      jest.spyOn(appService, 'getHello').mockReturnValue(expectedResponse);

      expect(appController.getHello()).toBe(expectedResponse);
    });
  });

  describe('health', () => {
    it('should return health check status', () => {
      const expectedResponse = {
        status: 'OK',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memoryUsage: expect.any(Object),
        cpu: {
          usage: expect.any(String),
          loadAvg: expect.any(Array),
        },
      };

      jest.spyOn(appService, 'getHealth').mockReturnValue(expectedResponse);

      const result = appController.getHealth();
      expect(result).toMatchObject(expectedResponse);
    });
  });

  describe('metrics', () => {
    it('should return server metrics', () => {
      const expectedResponse = {
        summary: {
          uptime: expect.any(String),
          systemUptime: expect.any(String),
          timestamp: expect.any(String),
        },
        cpu: {
          usage: expect.any(String),
          loadAvg: expect.any(Array),
          cores: expect.any(Number),
          graph: expect.any(String),
        },
        memory: {
          total: expect.any(String),
          used: expect.any(String),
          free: expect.any(String),
          usage: expect.any(String),
          graph: expect.any(String),
        },
        requests: {
          total: expect.any(String),
          success: expect.any(String),
          failed: expect.any(String),
          lastMinute: expect.any(Number),
          graph: expect.any(String),
        },
        system: {
          platform: expect.any(String),
          release: expect.any(String),
          hostname: expect.any(String),
          arch: expect.any(String),
        },
      };

      jest.spyOn(appService, 'getMetrics').mockReturnValue(expectedResponse);

      const result = appController.getMetrics();
      expect(result).toMatchObject(expectedResponse);
    });
  });

  describe('version', () => {
    it('should return API version', () => {
      const expectedResponse = {
        version: '1.0.0',
        environment: 'test',
        timestamp: expect.any(String),
      };

      jest.spyOn(appService, 'getVersion').mockReturnValue(expectedResponse);

      const result = appController.getVersion();
      expect(result).toMatchObject(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', () => {
      jest.spyOn(appService, 'getHello').mockImplementation(() => {
        throw new Error('Service Error');
      });

      expect(() => appController.getHello()).toThrow('Service Error');
    });
  });

  describe('configuration', () => {
    it('should use configured port number', () => {
      const configService = module.get<ConfigService>(ConfigService);
      expect(configService.get('PORT')).toBe('3000');
    });
  });
});
