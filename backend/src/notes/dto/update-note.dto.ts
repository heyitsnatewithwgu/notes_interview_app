import { IsString, IsOptional, IsDateString, IsIn, IsInt } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  title?: string;

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

  // Used for optimistic locking - client must send the updatedAt they last saw
  @IsDateString()
  expectedUpdatedAt: string;
}
