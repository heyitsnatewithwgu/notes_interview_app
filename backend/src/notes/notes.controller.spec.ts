import { Test } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

/**
 * Unit tests for NotesController — the service is mocked. These assert the
 * controller is a thin routing layer that binds params/body and delegates to
 * the service (no business logic of its own).
 */
describe('NotesController (unit)', () => {
  let controller: NotesController;
  let service: jest.Mocked<NotesService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            reorder: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(NotesController);
    service = moduleRef.get(NotesService);
  });

  it('findAll delegates to the service', () => {
    const notes = [{ id: 'a' }] as never;
    service.findAll.mockReturnValue(notes);
    expect(controller.findAll()).toBe(notes);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne passes the id through', () => {
    const note = { id: 'a' } as never;
    service.findOne.mockReturnValue(note);
    expect(controller.findOne('a')).toBe(note);
    expect(service.findOne).toHaveBeenCalledWith('a');
  });

  it('create passes the DTO through', () => {
    const dto = { title: 'New' };
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update passes id and DTO through', () => {
    const dto = { title: 'Edit', expectedUpdatedAt: '2026-07-01T00:00:00.000Z' };
    controller.update('a', dto);
    expect(service.update).toHaveBeenCalledWith('a', dto);
  });

  it('reorder passes the DTO through', () => {
    const dto = { noteIds: ['a', 'b'] };
    controller.reorder(dto);
    expect(service.reorder).toHaveBeenCalledWith(dto);
  });

  it('delete delegates to the service', () => {
    controller.delete('a');
    expect(service.delete).toHaveBeenCalledWith('a');
  });
});
