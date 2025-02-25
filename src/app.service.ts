import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import * as asciichart from 'asciichart';

@Injectable()
export class AppService implements OnModuleInit {
  private cpuHistory: number[] = new Array(60).fill(0);
  private memoryHistory: number[] = new Array(60).fill(0);
  private requestHistory: number[] = new Array(60).fill(0);
  private requestCount = 0;

  private metrics = {
    requests: {
      total: 0,
      success: 0,
      failed: 0,
      lastMinute: 0,
      history: [] as number[],
    },
    cpu: {
      usage: 0,
      loadAvg: [0, 0, 0],
    },
    memory: {
      total: 0,
      used: 0,
      free: 0,
    },
    startTime: Date.now(),
  };

  private updateInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  private updateMetrics() {
    // Update request count
    this.requestCount++;
    this.requestHistory.push(this.requestCount);
    this.requestHistory.shift();

    // Update CPU metrics
    const cpuUsage = Math.round((1 - os.loadavg()[0] / os.cpus().length) * 100);
    this.metrics.cpu.usage = cpuUsage;
    this.cpuHistory.push(cpuUsage);
    this.cpuHistory.shift();

    // Update Memory metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);
    this.metrics.memory = { total: totalMem, used: usedMem, free: freeMem };
    this.memoryHistory.push(memoryUsage);
    this.memoryHistory.shift();
  }

  private generateGraph(
    data: number[],
    title: string,
    height: number = 10,
    isPercentage: boolean = true,
  ): string {
    const config = {
      height,
      colors: [asciichart.blue],
      format: (x: number) =>
        isPercentage ? `${x.toFixed(0)}%` : x.toString().padStart(4),
    };
    return `\n${title}\n${asciichart.plot(data, config)}\n`;
  }

  getCombinedMetrics() {
    const uptimePercent = (process.uptime() / os.uptime()) * 100;
    const cpuGraph = this.generateGraph(
      this.cpuHistory,
      'CPU Usage % (last 60s)',
    );
    const memGraph = this.generateGraph(
      this.memoryHistory,
      'Memory Usage % (last 60s)',
    );
    const reqGraph = this.generateGraph(
      this.requestHistory,
      'Requests Count (last 60s)',
      10,
      false,
    );

    return {
      status: {
        health: 'OK',
        uptime: {
          percent: `${uptimePercent.toFixed(2)}%`,
          server: this.formatDuration(process.uptime()),
          system: this.formatDuration(os.uptime()),
        },
        lastChecked: new Date().toLocaleString(),
      },
      performance: {
        cpu: {
          usage: `${this.metrics.cpu.usage}%`,
          cores: os.cpus().length,
          loadAvg: os.loadavg().map((load) => load.toFixed(2)),
          graph: cpuGraph,
        },
        memory: {
          total: this.formatBytes(this.metrics.memory.total),
          used: this.formatBytes(this.metrics.memory.used),
          free: this.formatBytes(this.metrics.memory.free),
          usage: `${Math.round((this.metrics.memory.used / this.metrics.memory.total) * 100)}%`,
          graph: memGraph,
        },
      },
      traffic: {
        requests: {
          total: this.formatNumber(this.metrics.requests.total),
          success: this.formatNumber(this.metrics.requests.success),
          failed: this.formatNumber(this.metrics.requests.failed),
          perSecond: (this.requestCount / process.uptime()).toFixed(2),
          graph: reqGraph,
        },
      },
      system: {
        platform: `${os.platform()} (${os.release()})`,
        arch: os.arch(),
        hostname: os.hostname(),
      },
    };
  }

  getHello(): string {
    this.metrics.requests.total++;
    this.metrics.requests.success++;
    return `Server is running on port ${this.configService.get('PORT')}\nStatus: OK`;
  }

  getHealth() {
    this.metrics.requests.total++;
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpu: {
        usage: `${this.metrics.cpu.usage}%`,
        loadAvg: this.metrics.cpu.loadAvg,
      },
    };
  }

  getMetrics() {
    this.metrics.requests.total++;
    const cpuGraph = this.generateGraph(
      this.cpuHistory,
      'CPU Usage (last 60s)',
    );
    const memGraph = this.generateGraph(
      this.memoryHistory,
      'Memory Usage (last 60s)',
    );
    const reqGraph = this.generateGraph(
      this.requestHistory,
      'Requests (last 60s)',
    );

    return {
      summary: {
        uptime: this.formatDuration(process.uptime()),
        systemUptime: this.formatDuration(os.uptime()),
        timestamp: new Date().toLocaleString(),
      },
      cpu: {
        usage: `${this.metrics.cpu.usage}%`,
        loadAvg: this.metrics.cpu.loadAvg.map((load) => load.toFixed(2)),
        cores: os.cpus().length,
        graph: cpuGraph,
      },
      memory: {
        total: this.formatBytes(this.metrics.memory.total),
        used: this.formatBytes(this.metrics.memory.used),
        free: this.formatBytes(this.metrics.memory.free),
        usage: `${Math.round((this.metrics.memory.used / this.metrics.memory.total) * 100)}%`,
        graph: memGraph,
      },
      requests: {
        total: this.formatNumber(this.metrics.requests.total),
        success: this.formatNumber(this.metrics.requests.success),
        failed: this.formatNumber(this.metrics.requests.failed),
        lastMinute: this.metrics.requests.lastMinute,
        graph: reqGraph,
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
        arch: os.arch(),
      },
    };
  }

  private formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  private formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  getVersion() {
    return {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }

  onModuleDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
