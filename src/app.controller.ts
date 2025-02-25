import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('metrics')
  getMetrics() {
    return this.appService.getMetrics();
  }

  @Get('version')
  getVersion() {
    return this.appService.getVersion();
  }

  @Get('combined-metrics')
  getCombinedMetrics() {
    return this.appService.getCombinedMetrics();
  }
}
