import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';
import { RegisterResponse, LoginResponse } from './interfaces/user.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface RequestWithUser extends FastifyRequest {
  user: {
    userId: number;
    role: Role;
  };
}

@Controller('user') // handles requests to /users
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /*
  GET /user (admin only)
  GET /user/:id (admin only)
  POST /user/register
  POST /user/login
  PATCH /user/:id (admin / self)
  DELETE /user/:id (admin / self)
  */

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.usersService.findAll(req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usersService.findOne(id, req.user.userId);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponse> {
    return this.usersService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponse> {
    return this.usersService.login(loginUserDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.update(id, updateUserDto, req.user.userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usersService.remove(id, req.user.userId);
  }

  @Post('initialize')
  initializeUsers() {
    return this.usersService.initializeUsers();
  }

  @Get('test-redis-connection')
  async testRedisConnection() {
    try {
      const testKey = 'test:connection';
      const testValue = { test: 'data', timestamp: new Date().toISOString() };

      // Try to set data
      await this.cacheManager.set(testKey, testValue, 300);

      // Try to get data back
      const retrieved = await this.cacheManager.get(testKey);

      return {
        success: true,
        stored: testValue,
        retrieved,
        match: JSON.stringify(testValue) === JSON.stringify(retrieved),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
