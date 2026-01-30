# Backend Skills

## /add-module
Create a new NestJS feature module with controller, service, entity, and DTOs.

**Usage**: `/add-module feature-name`

**Creates**:
```
src/feature-name/
├── feature-name.module.ts
├── feature-name.controller.ts
├── feature-name.service.ts
├── dto/
│   ├── create-feature-name.dto.ts
│   └── update-feature-name.dto.ts
└── entities/
    └── feature-name.entity.ts
```

**Steps**:
1. Create the directory structure
2. Create entity with TypeORM decorators
3. Create DTOs with class-validator
4. Create service with CRUD operations
5. Create controller with REST endpoints
6. Create module and register in AppModule

## /add-entity
Add a new TypeORM entity to an existing module.

**Usage**: `/add-entity ModuleName EntityName`

**Template**:
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## /add-dto
Add a new DTO to a module.

**Usage**: `/add-dto ModuleName DtoName`

**Template**:
```typescript
import { IsString, IsOptional } from 'class-validator';

export class DtoName {
  @IsString()
  @IsOptional()
  field?: string;
}
```

## /add-endpoint
Add a new endpoint to an existing controller.

**Usage**: `/add-endpoint ControllerName methodName`

**HTTP Method Templates**:
```typescript
// GET single
@Get(':id')
findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

// POST
@Post()
create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}

// PUT
@Put(':id')
update(@Param('id') id: string, @Body() dto: UpdateDto) {
  return this.service.update(id, dto);
}

// PATCH
@Patch(':id')
patch(@Param('id') id: string, @Body() dto: PatchDto) {
  return this.service.patch(id, dto);
}

// DELETE
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
delete(@Param('id') id: string) {
  return this.service.delete(id);
}
```

## /add-relation
Add a TypeORM relation between entities.

**Usage**: `/add-relation EntityA EntityB relationType`

**Relation Types**:
```typescript
// One-to-Many
@OneToMany(() => Child, (child) => child.parent)
children: Child[];

// Many-to-One
@ManyToOne(() => Parent, (parent) => parent.children)
parent: Parent;

// Many-to-Many
@ManyToMany(() => Tag)
@JoinTable()
tags: Tag[];
```

## /test-api
Test API endpoints with curl commands.

**Commands**:
```bash
# List all
curl http://localhost:3000/notes

# Get one
curl http://localhost:3000/notes/<id>

# Create
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Content"}'

# Update
curl -X PUT http://localhost:3000/notes/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","expectedUpdatedAt":"<timestamp>"}'

# Delete
curl -X DELETE http://localhost:3000/notes/<id>
```

## /check-db
Check database connection and run queries.

**Commands**:
```bash
# Connect to PostgreSQL in Docker
docker exec -it notesapp-interview-postgres-1 psql -U postgres -d notes

# List tables
\dt

# Describe table
\d notes

# Query notes
SELECT * FROM notes;
```

## /run-migration
Create and run TypeORM migrations.

**Commands**:
```bash
# Generate migration
npx typeorm migration:generate -d src/data-source.ts src/migrations/MigrationName

# Run migrations
npx typeorm migration:run -d src/data-source.ts

# Revert migration
npx typeorm migration:revert -d src/data-source.ts
```

## /restart-backend
Restart the backend service in Docker.

**Command**:
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

## /view-logs
View backend logs.

**Command**:
```bash
docker-compose -f docker-compose.dev.yml logs -f backend
```

## /add-validation
Add custom validation to a DTO field.

**Common Validators**:
```typescript
@IsString()
@IsNumber()
@IsBoolean()
@IsDate()
@IsEmail()
@IsUrl()
@IsUUID()
@IsEnum(EnumType)
@IsIn(['option1', 'option2'])
@MinLength(3)
@MaxLength(100)
@Min(0)
@Max(100)
@IsOptional()
@IsNotEmpty()
@ValidateNested()
@Type(() => NestedDto)
```
