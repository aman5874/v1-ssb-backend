import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { TranscriptionResponseDto } from '../dto/response/transcription-response.dto';

@Injectable()
export class TranscribeResponseValidationPipe implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      map(async (value) => {
        if (!value) {
          throw new HttpException('Response is empty', HttpStatus.BAD_REQUEST);
        }

        const object = plainToClass(TranscriptionResponseDto, value);
        const errors = await validate(object);

        if (errors.length > 0) {
          throw new HttpException(
            {
              message: 'Response validation failed',
              errors: errors.map((error) => ({
                property: error.property,
                constraints: error.constraints,
              })),
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        return object;
      }),
    );
  }
}
