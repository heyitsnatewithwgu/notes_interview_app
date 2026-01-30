import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  @IsIn(['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])
  color?: string;

  @IsInt()
  @IsOptional()
  position?: number;
}
