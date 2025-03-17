import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class CustomSpelling {
  @IsArray()
  @IsString({ each: true })
  from: string[];

  @IsString()
  @IsNotEmpty()
  to: string;
}
