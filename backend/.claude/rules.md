# Backend Development Rules

## Technology Stack
- **Framework**: NestJS v11
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Validation**: class-validator & class-transformer
- **Runtime**: Node.js 20

## Project Structure

```
src/
├── main.ts              # Application entry point
├── app.module.ts        # Root module
└── <feature>/           # Feature modules
    ├── <feature>.module.ts
    ├── <feature>.controller.ts
    ├── <feature>.service.ts
    ├── dto/
    │   ├── create-<feature>.dto.ts
    │   └── update-<feature>.dto.ts
    └── entities/
        └── <feature>.entity.ts
```

## Naming Conventions

### Files
- **Modules**: `<feature>.module.ts`
- **Controllers**: `<feature>.controller.ts`
- **Services**: `<feature>.service.ts`
- **Entities**: `<feature>.entity.ts`
- **DTOs**: `create-<feature>.dto.ts`, `update-<feature>.dto.ts`

### Classes
- **Modules**: `<Feature>Module`
- **Controllers**: `<Feature>Controller`
- **Services**: `<Feature>Service`
- **Entities**: `<Feature>` (singular)
- **DTOs**: `Create<Feature>Dto`, `Update<Feature>Dto`

## Entity Guidelines

### TypeORM Entity Pattern
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('<table_name>')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  field: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Optimistic Locking
For entities that may have concurrent edits, add:
```typescript
@VersionColumn()
version: number;
```

And check `updatedAt` timestamps in update operations.

## DTO Guidelines

### Validation Decorators
```typescript
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  requiredField: string;

  @IsString()
  @IsOptional()
  optionalField?: string;

  @IsIn(['option1', 'option2'])
  enumField: string;
}
```

### Update DTOs
- All fields should be `@IsOptional()`
- Include `expectedUpdatedAt` for optimistic locking

## Service Guidelines

1. **Inject repositories** using `@InjectRepository()`
2. **Throw NestJS exceptions** (`NotFoundException`, `ConflictException`, etc.)
3. **Return entities directly** - NestJS serializes them automatically
4. **Use async/await** for all database operations

### Error Handling Pattern
```typescript
async findOne(id: string): Promise<Entity> {
  const entity = await this.repository.findOne({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`Entity with id ${id} not found`);
  }
  return entity;
}
```

## Controller Guidelines

1. **Use decorators** for HTTP methods (`@Get()`, `@Post()`, etc.)
2. **Use `@Param()` and `@Body()`** for input extraction
3. **Return service results directly** - NestJS handles serialization
4. **Use appropriate HTTP status codes** via `@HttpCode()`

### Route Pattern
```typescript
@Controller('resources')
export class ResourceController {
  @Get()
  findAll() { }

  @Get(':id')
  findOne(@Param('id') id: string) { }

  @Post()
  create(@Body() dto: CreateDto) { }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDto) { }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) { }
}
```

## Database Rules

1. **Use UUID** for primary keys (`@PrimaryGeneratedColumn('uuid')`)
2. **Always include timestamps** (`createdAt`, `updatedAt`)
3. **Use migrations** for production (synchronize: false)
4. **Index frequently queried columns**

## CORS Configuration

CORS is configured in `main.ts`. When adding new frontend origins:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:80'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
});
```

## Environment Variables

Required environment variables:
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name
- `DB_SYNCHRONIZE` - Auto-sync schema (true/false)
