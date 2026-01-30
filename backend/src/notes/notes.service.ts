import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note, NoteColor } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ReorderNotesDto } from './dto/reorder-notes.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async findAll(): Promise<Note[]> {
    return this.notesRepository.find({
      order: { position: 'ASC', updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.notesRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
    return note;
  }

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    // Get the highest position to add new note at the end
    const maxPosition = await this.notesRepository
      .createQueryBuilder('note')
      .select('MAX(note.position)', 'max')
      .getRawOne();

    const note = this.notesRepository.create({
      title: createNoteDto.title,
      body: createNoteDto.body ?? '',
      color: (createNoteDto.color as NoteColor) ?? 'default',
      position: (maxPosition?.max ?? -1) + 1,
    });
    return this.notesRepository.save(note);
  }

  async update(id: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const existingNote = await this.findOne(id);

    // Optimistic locking: check if the note has been modified since the client last saw it
    const expectedUpdatedAt = new Date(updateNoteDto.expectedUpdatedAt);
    if (existingNote.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new ConflictException({
        message: 'Note has been modified by another user',
        currentNote: existingNote,
      });
    }

    // Apply updates
    if (updateNoteDto.title !== undefined) {
      existingNote.title = updateNoteDto.title;
    }
    if (updateNoteDto.body !== undefined) {
      existingNote.body = updateNoteDto.body;
    }
    if (updateNoteDto.color !== undefined) {
      existingNote.color = updateNoteDto.color as NoteColor;
    }
    if (updateNoteDto.position !== undefined) {
      existingNote.position = updateNoteDto.position;
    }

    return this.notesRepository.save(existingNote);
  }

  async reorder(reorderDto: ReorderNotesDto): Promise<Note[]> {
    const { noteIds } = reorderDto;

    // Update positions based on the order of IDs
    await Promise.all(
      noteIds.map((id, index) =>
        this.notesRepository.update(id, { position: index })
      )
    );

    return this.findAll();
  }

  async delete(id: string): Promise<void> {
    const result = await this.notesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
  }
}
