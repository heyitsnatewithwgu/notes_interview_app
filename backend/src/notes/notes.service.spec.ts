import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';

/**
 * Unit tests for NotesService — the repository is fully mocked, so these
 * exercise business logic (ordering, position assignment, optimistic locking,
 * reorder, delete) in isolation with no database.
 */
describe('NotesService (unit)', () => {
  let service: NotesService;
  let repo: jest.Mocked<Repository<Note>>;

  // A minimal chainable query-builder mock for the MAX(position) lookup.
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(NotesService);
    repo = moduleRef.get(getRepositoryToken(Note));
  });

  const makeNote = (overrides: Partial<Note> = {}): Note =>
    ({
      id: 'note-1',
      title: 'Title',
      body: 'Body',
      color: 'default',
      position: 0,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      updatedAt: new Date('2026-07-01T00:00:00.000Z'),
      version: 1,
      ...overrides,
    }) as Note;

  describe('findAll', () => {
    it('returns notes ordered by position ASC then updatedAt DESC', async () => {
      const notes = [makeNote()];
      repo.find.mockResolvedValue(notes);

      await expect(service.findAll()).resolves.toBe(notes);
      expect(repo.find).toHaveBeenCalledWith({
        order: { position: 'ASC', updatedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the note when found', async () => {
      const note = makeNote();
      repo.findOne.mockResolvedValue(note);
      await expect(service.findOne('note-1')).resolves.toBe(note);
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('appends the note at MAX(position) + 1 and applies defaults', async () => {
      queryBuilder.getRawOne.mockResolvedValue({ max: 4 });
      repo.create.mockImplementation((dto) => dto as Note);
      repo.save.mockImplementation(async (n) => n as Note);

      const result = await service.create({ title: 'New' });

      expect(repo.create).toHaveBeenCalledWith({
        title: 'New',
        body: '',
        color: 'default',
        position: 5,
      });
      expect(result.position).toBe(5);
    });

    it('assigns position 0 for the first note (no existing max)', async () => {
      queryBuilder.getRawOne.mockResolvedValue({ max: null });
      repo.create.mockImplementation((dto) => dto as Note);
      repo.save.mockImplementation(async (n) => n as Note);

      const result = await service.create({ title: 'First', body: 'hi', color: 'blue' });

      expect(result.position).toBe(0);
      expect(result.body).toBe('hi');
      expect(result.color).toBe('blue');
    });
  });

  describe('update (optimistic locking)', () => {
    it('applies only provided fields when expectedUpdatedAt matches', async () => {
      const existing = makeNote();
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation(async (n) => n as Note);

      const result = await service.update('note-1', {
        title: 'Edited',
        expectedUpdatedAt: existing.updatedAt.toISOString(),
      });

      expect(result.title).toBe('Edited');
      expect(result.body).toBe('Body'); // untouched
      expect(repo.save).toHaveBeenCalledWith(existing);
    });

    it('throws ConflictException with { message, currentNote } when stale', async () => {
      const existing = makeNote();
      repo.findOne.mockResolvedValue(existing);

      expect.assertions(3);
      try {
        await service.update('note-1', {
          title: 'Edited',
          expectedUpdatedAt: '2020-01-01T00:00:00.000Z', // stale
        });
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictException);
        const body = (err as ConflictException).getResponse();
        expect(body).toHaveProperty('message', 'Note has been modified by another user');
        expect(body).toHaveProperty('currentNote', existing);
      }
    });

    it('throws NotFoundException when the note does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { expectedUpdatedAt: new Date().toISOString() }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('sets each note position to its index and returns the fresh list', async () => {
      const reordered = [makeNote({ id: 'b' }), makeNote({ id: 'a' })];
      repo.update.mockResolvedValue({} as never);
      repo.find.mockResolvedValue(reordered);

      const result = await service.reorder({ noteIds: ['b', 'a'] });

      expect(repo.update).toHaveBeenNthCalledWith(1, 'b', { position: 0 });
      expect(repo.update).toHaveBeenNthCalledWith(2, 'a', { position: 1 });
      expect(result).toBe(reordered);
    });
  });

  describe('delete', () => {
    it('resolves when a row was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as never);
      await expect(service.delete('note-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 0 } as never);
      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
