import { IsArray, IsString } from 'class-validator';

export class ReorderNotesDto {
  @IsArray()
  @IsString({ each: true })
  noteIds: string[];
}
