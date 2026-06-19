# Crear una feature CRUD de categoría con Clean Architecture

Esta guía muestra cómo crear una nueva feature de mantenimiento para `categories` desde cero. El objetivo es que la estructura grite negocio primero y que los detalles técnicos queden aislados detrás de contratos, mappers y repositorios.

## Resultado esperado

Al terminar, la app debería tener una feature lazy loaded en `/app/categories` con listado, creación, edición y eliminación de categorías.

La UI no debe llamar `HttpClient` directamente. Los DTOs del backend no deben llegar a los componentes. La lógica de flujo debe vivir en `application`. Los contratos y entidades deben vivir en `domain`. La API concreta debe vivir en `infrastructure`.

## Principios de esta receta

| Principio                    | Qué significa en esta feature                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Screaming Architecture       | La carpeta se llama `categories` porque esa es la capacidad de negocio. No se llama `services`, `components` ni `maintenance`. |
| Clean Architecture           | Las dependencias apuntan hacia el dominio: `presentation -> application -> domain` e `infrastructure -> domain`.               |
| DTO != Entity                | `CategoryDto` representa la API. `Category` representa el modelo interno del frontend.                                         |
| Application coordina         | `CategoriesFacade` orquesta cargar, crear, actualizar y eliminar. La página solo delega eventos.                               |
| Infraestructura adapta       | `CategoryHttpRepository` conoce endpoints, `HttpClient`, `environment` y `checkToken()`.                                       |
| Providers con scope correcto | Por defecto, registra providers en la ruta de la feature. Solo usa providers globales si `core/` necesita resolverlos.         |

## Estructura final

Crear esta estructura:

```txt
src/app/features/categories/
├── categories.providers.ts
├── categories.routes.ts
├── domain/
│   ├── entities/
│   │   └── category.entity.ts
│   ├── repositories/
│   │   └── category.repository.ts
│   └── rules/
│       ├── category-name.rule.spec.ts
│       └── category-name.rule.ts
├── application/
│   ├── dtos/
│   │   └── category.dto.ts
│   ├── facades/
│   │   ├── categories.facade.spec.ts
│   │   └── categories.facade.ts
│   └── mappers/
│       ├── category.mapper.spec.ts
│       └── category.mapper.ts
├── infrastructure/
│   └── repositories/
│       ├── category-http.repository.spec.ts
│       └── category-http.repository.ts
└── presentation/
    ├── components/
    │   ├── category-form/
    │   │   ├── category-form.component.html
    │   │   ├── category-form.component.spec.ts
    │   │   └── category-form.component.ts
    │   └── category-table/
    │       ├── category-table.component.html
    │       ├── category-table.component.spec.ts
    │       └── category-table.component.ts
    └── pages/
        └── categories/
            ├── categories.page.html
            ├── categories.page.spec.ts
            └── categories.page.ts
```

Si el CRUD es muy pequeño, `category-form` y `category-table` pueden empezar dentro de `categories.page.*`. Extráelos cuando la página empiece a mezclar demasiada UI. Clean Architecture no es crear carpetas por decorar; es separar responsabilidades cuando agregan claridad.

## Flujo de dependencias

```txt
CategoriesPage
  -> CategoriesFacade
    -> CATEGORY_REPOSITORY
      <- CategoryHttpRepository
        -> HttpClient
        -> CategoryMapper
          -> Category
```

La flecha importante es esta: la presentación depende de application, application depende del contrato de domain, e infrastructure implementa ese contrato.

## Paso 1: Definir el nombre de la feature

Crear la carpeta:

```txt
src/app/features/categories/
```

Por qué: el nombre debe comunicar negocio. `categories` dice que el sistema administra categorías. `category-service`, `maintenance` o `crud` dicen tecnología o mecanismo, no dominio.

## Paso 2: Crear la entidad de dominio

Archivo:

```txt
src/app/features/categories/domain/entities/category.entity.ts
```

Contenido base:

```ts
export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}
```

Por qué: `Category` es el modelo interno que usa la aplicación. No debería cambiar solo porque el backend cambie `is_active` por `active` o `created_at` por `createdAt`.

Regla: no importar `HttpClient`, rutas, componentes, DTOs ni Angular UI en esta entidad.

## Paso 3: Crear reglas puras de dominio

Archivos:

```txt
src/app/features/categories/domain/rules/category-name.rule.ts
src/app/features/categories/domain/rules/category-name.rule.spec.ts
```

Contenido base:

```ts
export const MIN_CATEGORY_NAME_LENGTH = 3;
export const MAX_CATEGORY_NAME_LENGTH = 80;

export function isValidCategoryName(name: string): boolean {
  const normalized = name.trim();
  return (
    normalized.length >= MIN_CATEGORY_NAME_LENGTH && normalized.length <= MAX_CATEGORY_NAME_LENGTH
  );
}
```

Por qué: las reglas puras se testean sin Angular. Si mañana el formulario cambia, esta regla sigue siendo válida.

Test esperado:

```ts
import { isValidCategoryName } from './category-name.rule';

describe('isValidCategoryName', () => {
  it('should reject short names', () => {
    expect(isValidCategoryName('ab')).toBe(false);
  });

  it('should accept valid names', () => {
    expect(isValidCategoryName('Backlog')).toBe(true);
  });
});
```

## Paso 4: Crear el contrato del repositorio

Archivo:

```txt
src/app/features/categories/domain/repositories/category.repository.ts
```

Contenido base:

```ts
import { InjectionToken } from '@angular/core';

import { Category, CreateCategoryInput, UpdateCategoryInput } from '../entities/category.entity';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: Category['id']): Promise<Category>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: Category['id'], input: UpdateCategoryInput): Promise<Category>;
  delete(id: Category['id']): Promise<void>;
}

export const CATEGORY_REPOSITORY = new InjectionToken<CategoryRepository>('CATEGORY_REPOSITORY');
```

Por qué: application necesita pedir categorías, pero no debe saber si vienen de REST, Firebase, IndexedDB o mocks. El contrato protege el flujo de negocio del detalle técnico.

Nota del proyecto: este repo acepta `InjectionToken` en `domain/repositories` porque ya usa ese patrón. En una Clean Architecture más estricta, el token podría vivir en `application/tokens`, pero aquí conviene mantener consistencia con el código existente.

## Paso 5: Crear los DTOs de la API

Archivo:

```txt
src/app/features/categories/application/dtos/category.dto.ts
```

Contenido base:

```ts
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}
```

Por qué: el DTO representa el contrato externo de la API. Si el backend devuelve campos opcionales o nombres distintos, ese problema se resuelve en mappers, no en la UI.

Regla del repo: los DTOs viven en `application/dtos` para mantener consistencia con las features existentes.

## Paso 6: Crear el mapper

Archivos:

```txt
src/app/features/categories/application/mappers/category.mapper.ts
src/app/features/categories/application/mappers/category.mapper.spec.ts
```

Contenido base:

```ts
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../domain/entities/category.entity';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';

export const CategoryMapper = {
  toDomain(dto: CategoryDto): Category {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  },

  toCreateDto(input: CreateCategoryInput): CreateCategoryDto {
    return {
      name: input.name.trim(),
      description: input.description.trim(),
      isActive: input.isActive,
    };
  },

  toUpdateDto(input: UpdateCategoryInput): UpdateCategoryDto {
    return {
      name: input.name?.trim(),
      description: input.description?.trim(),
      isActive: input.isActive,
    };
  },
};
```

Por qué: el mapper es el traductor entre el mundo externo y el dominio. Sin mapper, los componentes terminan sabiendo demasiado del backend.

Test mínimo:

```ts
import { CategoryMapper } from './category.mapper';

describe('CategoryMapper', () => {
  it('should map missing description to an empty string', () => {
    const category = CategoryMapper.toDomain({
      id: 'cat-1',
      name: 'Frontend',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(category.description).toBe('');
  });
});
```

## Paso 7: Crear el repositorio HTTP

Archivos:

```txt
src/app/features/categories/infrastructure/repositories/category-http.repository.ts
src/app/features/categories/infrastructure/repositories/category-http.repository.spec.ts
```

Contenido base:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { checkToken } from '@core/interceptors/token.interceptor';
import { environment } from '@environments/environment';

import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { CategoryDto } from '../../application/dtos/category.dto';
import { CategoryMapper } from '../../application/mappers/category.mapper';

@Injectable()
export class CategoryHttpRepository implements CategoryRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_URL;

  async findAll(): Promise<Category[]> {
    const dtos = await firstValueFrom(
      this.http.get<CategoryDto[]>(`${this.apiUrl}/api/v1/categories`, {
        context: checkToken(),
      }),
    );
    return dtos.map(CategoryMapper.toDomain);
  }

  async findById(id: Category['id']): Promise<Category> {
    const dto = await firstValueFrom(
      this.http.get<CategoryDto>(`${this.apiUrl}/api/v1/categories/${id}`, {
        context: checkToken(),
      }),
    );
    return CategoryMapper.toDomain(dto);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const dto = await firstValueFrom(
      this.http.post<CategoryDto>(
        `${this.apiUrl}/api/v1/categories`,
        CategoryMapper.toCreateDto(input),
        { context: checkToken() },
      ),
    );
    return CategoryMapper.toDomain(dto);
  }

  async update(id: Category['id'], input: UpdateCategoryInput): Promise<Category> {
    const dto = await firstValueFrom(
      this.http.put<CategoryDto>(
        `${this.apiUrl}/api/v1/categories/${id}`,
        CategoryMapper.toUpdateDto(input),
        { context: checkToken() },
      ),
    );
    return CategoryMapper.toDomain(dto);
  }

  async delete(id: Category['id']): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/api/v1/categories/${id}`, {
        context: checkToken(),
      }),
    );
  }
}
```

Por qué: este archivo es el único lugar que debe conocer endpoints, `HttpClient`, `environment.API_URL` y autenticación HTTP.

Regla: si ves `HttpClient` dentro de `presentation`, la arquitectura se rompio.

## Paso 8: Crear la facade de application

Archivos:

```txt
src/app/features/categories/application/facades/categories.facade.ts
src/app/features/categories/application/facades/categories.facade.spec.ts
```

Contenido base:

```ts
import { Injectable, computed, inject, signal } from '@angular/core';

import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../domain/entities/category.entity';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';

type RequestStatus = 'init' | 'loading' | 'success' | 'failed';

@Injectable()
export class CategoriesFacade {
  private readonly repository = inject(CATEGORY_REPOSITORY);

  private readonly _categories = signal<Category[]>([]);
  private readonly _status = signal<RequestStatus>('init');
  private readonly _error = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoading = computed(() => this._status() === 'loading');

  async loadCategories(): Promise<void> {
    this._status.set('loading');
    this._error.set(null);

    try {
      this._categories.set(await this.repository.findAll());
      this._status.set('success');
    } catch {
      this._categories.set([]);
      this._status.set('failed');
      this._error.set('Categories could not be loaded.');
    }
  }

  async createCategory(input: CreateCategoryInput): Promise<void> {
    const category = await this.repository.create(input);
    this._categories.update((categories) => [...categories, category]);
  }

  async updateCategory(id: Category['id'], input: UpdateCategoryInput): Promise<void> {
    const category = await this.repository.update(id, input);
    this._categories.update((categories) =>
      categories.map((item) => (item.id === category.id ? category : item)),
    );
  }

  async deleteCategory(id: Category['id']): Promise<void> {
    await this.repository.delete(id);
    this._categories.update((categories) => categories.filter((category) => category.id !== id));
  }
}
```

Por qué: la facade concentra el flujo de la feature. La página no decide cómo persistir, cómo actualizar estado ni cómo manejar el contrato del repositorio.

Decisión del repo: para un CRUD simple, una facade es suficiente. Si el flujo crece o hay reglas importantes por acción, separa `create-category.use-case.ts`, `update-category.use-case.ts`, `delete-category.use-case.ts` y deja la facade como coordinadora.

## Paso 9: Crear providers de la feature

Archivo:

```txt
src/app/features/categories/categories.providers.ts
```

Contenido base:

```ts
import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { CategoriesFacade } from './application/facades/categories.facade';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { CategoryHttpRepository } from './infrastructure/repositories/category-http.repository';

export const CATEGORY_PROVIDERS: Provider[] = [
  CategoryHttpRepository,
  CategoriesFacade,
  { provide: CATEGORY_REPOSITORY, useExisting: CategoryHttpRepository },
];

export function provideCategories(): EnvironmentProviders {
  return makeEnvironmentProviders(CATEGORY_PROVIDERS);
}
```

Por qué: los providers quedan encapsulados en la feature. `main.ts` no debería crecer con providers de cada mantenimiento si la feature solo se usa dentro de su ruta.

Regla importante: no mezcles scopes. Si `CategoriesFacade` usa `@Injectable({ providedIn: 'root' })`, entonces no puede depender de un token registrado solo en una ruta hija. Para route-scoped providers, deja `@Injectable()` y registra `CategoriesFacade` en `categories.providers.ts`.

## Paso 10: Crear la ruta lazy loaded de la feature

Archivo:

```txt
src/app/features/categories/categories.routes.ts
```

Contenido base:

```ts
import { Routes } from '@angular/router';

import { provideCategories } from './categories.providers';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    providers: [provideCategories()],
    loadComponent: () =>
      import('./presentation/pages/categories/categories.page').then((m) => m.CategoriesPage),
  },
];
```

Por qué: la feature se carga bajo demanda. La app principal no necesita descargar ni resolver categorías hasta que el usuario entre a `/app/categories`.

## Paso 11: Conectar la feature al layout protegido

Archivo a editar:

```txt
src/app/core/layout/layout.routes.ts
```

Agregar la ruta dentro de `children`:

```ts
{
  path: 'categories',
  canActivate: [authGuard],
  loadChildren: () =>
    import('@features/categories/categories.routes').then(
      (m) => m.CATEGORIES_ROUTES,
    ),
},
```

Por qué: en este proyecto las pantallas privadas viven bajo `/app`. La ruta final queda `/app/categories` y mantiene el mismo guard de autenticación que `boards`, `users` y `profile`.

Si la feature debe aparecer en navegación, actualizar también:

```txt
src/app/core/layout/components/navbar/navbar.component.html
```

Regla: agregar un link de navegación es presentación global. No pongas lógica de categoría dentro del navbar.

## Paso 12: Crear la página contenedora

Archivos:

```txt
src/app/features/categories/presentation/pages/categories/categories.page.ts
src/app/features/categories/presentation/pages/categories/categories.page.html
src/app/features/categories/presentation/pages/categories/categories.page.spec.ts
```

Contenido base del TS:

```ts
import { Component, inject } from '@angular/core';

import { CategoryFormComponent } from '../../components/category-form/category-form.component';
import { CategoryTableComponent } from '../../components/category-table/category-table.component';
import { CategoriesFacade } from '../../../application/facades/categories.facade';
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../../domain/entities/category.entity';

@Component({
  selector: 'app-categories-page',
  imports: [CategoryFormComponent, CategoryTableComponent],
  templateUrl: './categories.page.html',
})
export class CategoriesPage {
  readonly facade = inject(CategoriesFacade);

  constructor() {
    void this.facade.loadCategories();
  }

  createCategory(input: CreateCategoryInput): Promise<void> {
    return this.facade.createCategory(input);
  }

  updateCategory(event: { id: Category['id']; input: UpdateCategoryInput }): Promise<void> {
    return this.facade.updateCategory(event.id, event.input);
  }

  deleteCategory(id: Category['id']): Promise<void> {
    return this.facade.deleteCategory(id);
  }
}
```

Contenido base del HTML:

```html
<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
  <header class="flex flex-col gap-2">
    <p class="text-sm font-medium text-text-secondary">Maintenance</p>
    <h1 class="text-3xl font-semibold text-text-primary">Categories</h1>
    <p class="text-sm text-text-secondary">
      Manage the categories used to organize the board catalog.
    </p>
  </header>

  <app-category-form (saved)="createCategory($event)" />

  @if (facade.error()) {
  <p class="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
    {{ facade.error() }}
  </p>
  }

  <app-category-table
    [categories]="facade.categories()"
    [loading]="facade.isLoading()"
    (deleted)="deleteCategory($event)"
    (updated)="updateCategory($event)"
  />
</section>
```

Por qué: la página coordina componentes visuales y delega acciones. No conoce endpoints, DTOs ni `HttpClient`.

## Paso 13: Crear el formulario

Archivos:

```txt
src/app/features/categories/presentation/components/category-form/category-form.component.ts
src/app/features/categories/presentation/components/category-form/category-form.component.html
src/app/features/categories/presentation/components/category-form/category-form.component.spec.ts
```

Responsabilidad: capturar datos y emitir un `CreateCategoryInput` o `UpdateCategoryInput`. No debe guardar por HTTP.

Contenido base del TS con Signal Forms:

```ts
import { Component, output, signal } from '@angular/core';
import { FormField, form, maxLength, minLength, required, submit } from '@angular/forms/signals';

import { CreateCategoryInput } from '../../../domain/entities/category.entity';

@Component({
  selector: 'app-category-form',
  imports: [FormField],
  templateUrl: './category-form.component.html',
})
export class CategoryFormComponent {
  readonly saved = output<CreateCategoryInput>();

  readonly model = signal<CreateCategoryInput>({
    name: '',
    description: '',
    isActive: true,
  });

  readonly categoryForm = form(this.model, (path) => {
    required(path.name, { message: 'Name is required.' });
    minLength(path.name, 3, { message: 'Name is too short.' });
    maxLength(path.name, 80, { message: 'Name is too long.' });
    maxLength(path.description, 240, {
      message: 'Description is too long.',
    });
  });

  submitForm(): void {
    submit(this.categoryForm, async () => {
      this.saved.emit(this.model());
      this.categoryForm().reset();
    });
  }
}
```

Contenido base del HTML:

```html
<form
  class="rounded-3xl border border-[#EAEAEA] bg-surface p-5"
  (submit)="submitForm(); $event.preventDefault()"
>
  <div class="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
    <label class="flex flex-col gap-2 text-sm font-medium text-text-primary">
      Name
      <input
        class="rounded-2xl border border-[#EAEAEA] px-4 py-3 outline-none focus:border-primary-400"
        [formField]="categoryForm.name"
        autocomplete="off"
      />
    </label>

    <label class="flex flex-col gap-2 text-sm font-medium text-text-primary">
      Description
      <input
        class="rounded-2xl border border-[#EAEAEA] px-4 py-3 outline-none focus:border-primary-400"
        [formField]="categoryForm.description"
        autocomplete="off"
      />
    </label>

    <button
      class="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      type="submit"
      [disabled]="categoryForm().invalid()"
    >
      Save category
    </button>
  </div>

  @if (categoryForm.name().touched() && categoryForm.name().invalid()) {
  <p class="mt-3 text-sm text-danger-700">{{ categoryForm.name().errors()[0].message }}</p>
  }
</form>
```

Por qué: el formulario es presentación. Puede validar campos y emitir eventos, pero no decide persistencia. El guardado pertenece a `CategoriesFacade`.

Reglas Angular 22 para nuevos formularios:

| Regla                                  | Por qué                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Usar `@angular/forms/signals`          | Mantiene el estado del formulario como signals tipadas.                                   |
| No usar `null` como valor inicial      | Los campos HTML no aceptan bien `null`; usar `''`, `0`, `false` o `[]`.                   |
| Usar `(submit)` y `submit()`           | `submit()` marca campos como touched y ejecuta la acción solo si el formulario es válido. |
| No bindear `[value]` con `[formField]` | `[formField]` ya controla el valor.                                                       |

## Paso 14: Crear la tabla

Archivos:

```txt
src/app/features/categories/presentation/components/category-table/category-table.component.ts
src/app/features/categories/presentation/components/category-table/category-table.component.html
src/app/features/categories/presentation/components/category-table/category-table.component.spec.ts
```

Responsabilidad: renderizar categorías y emitir eventos de UI.

Contenido base del TS:

```ts
import { Component, input, output } from '@angular/core';

import { Category, UpdateCategoryInput } from '../../../domain/entities/category.entity';

@Component({
  selector: 'app-category-table',
  templateUrl: './category-table.component.html',
})
export class CategoryTableComponent {
  readonly categories = input<Category[]>([]);
  readonly loading = input(false);
  readonly deleted = output<Category['id']>();
  readonly updated = output<{
    id: Category['id'];
    input: UpdateCategoryInput;
  }>();
}
```

Contenido base del HTML:

```html
<div class="overflow-hidden rounded-3xl border border-[#EAEAEA] bg-surface">
  @if (loading()) {
  <p class="p-5 text-sm text-text-secondary">Loading categories...</p>
  } @else if (categories().length === 0) {
  <p class="p-5 text-sm text-text-secondary">No categories yet.</p>
  } @else {
  <table class="w-full text-left text-sm">
    <thead class="border-b border-[#EAEAEA] text-text-secondary">
      <tr>
        <th class="px-5 py-4 font-medium">Name</th>
        <th class="px-5 py-4 font-medium">Description</th>
        <th class="px-5 py-4 font-medium">Status</th>
        <th class="px-5 py-4 text-right font-medium">Actions</th>
      </tr>
    </thead>
    <tbody>
      @for (category of categories(); track category.id) {
      <tr class="border-b border-[#EAEAEA] last:border-b-0">
        <td class="px-5 py-4 font-medium text-text-primary">{{ category.name }}</td>
        <td class="px-5 py-4 text-text-secondary">{{ category.description }}</td>
        <td class="px-5 py-4 text-text-secondary">
          {{ category.isActive ? 'Active' : 'Inactive' }}
        </td>
        <td class="px-5 py-4 text-right">
          <button
            class="text-sm font-semibold text-danger-700"
            type="button"
            (click)="deleted.emit(category.id)"
          >
            Delete
          </button>
        </td>
      </tr>
      }
    </tbody>
  </table>
  }
</div>
```

Por qué: la tabla es componente presentacional. Recibe datos por `input()` y notifica acciones por `output()`. No inyecta facade ni repositorio.

## Paso 15: Manejar confirmación de eliminación

Antes de borrar, usar un dialog de confirmación si la acción destruye datos.

Opcion recomendada en este repo:

```txt
src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
```

Por qué: confirmar borrado es una preocupación visual reutilizable y no pertenece al dominio de categorías.

Regla: la confirmación vive en presentación; la eliminación real vive en `CategoriesFacade.deleteCategory()`.

## Paso 16: Agregar pruebas

Crear pruebas al lado del archivo que prueban.

| Archivo                            | Qué debe probar                                                             |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `category-name.rule.spec.ts`       | Reglas puras del nombre sin Angular TestBed.                                |
| `category.mapper.spec.ts`          | Conversion de DTO a dominio y de inputs a DTOs.                             |
| `categories.facade.spec.ts`        | Que la facade llame el contrato correcto y actualice signals.               |
| `category-http.repository.spec.ts` | Que use el endpoint correcto, `checkToken()` y mapee la respuesta.          |
| `category-form.component.spec.ts`  | Validación, estado disabled del submit y emisión de `saved`.                |
| `category-table.component.spec.ts` | Render de filas, estados vacío/loading y emisión de `deleted`.              |
| `categories.page.spec.ts`          | Que la página cargue categorías y delegue create/update/delete a la facade. |

Convenciones del repo:

| Convencion              | Aplicacion                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Vitest                  | Usar `describe`, `it`, `expect`, `vi`.                                                                |
| Testing Library Angular | Probar comportamiento visible, no detalles internos.                                                  |
| Templates externos      | Si Vitest no resuelve `templateUrl`, crear un host component con template inline que refleje el real. |
| No `any`                | Tipar mocks con el contrato real.                                                                     |

## Paso 17: Agregar E2E si la ruta es crítica

Archivo sugerido:

```txt
e2e/categories.spec.ts
```

Escenarios minimos:

| Escenario                              | Valor                                            |
| -------------------------------------- | ------------------------------------------------ |
| Entrar a `/app/categories` autenticado | Verifica ruta, guard y carga inicial.            |
| Crear categoría                        | Verifica formulario, POST mockeado y nueva fila. |
| Editar categoría                       | Verifica actualización visible.                  |
| Eliminar categoría                     | Verifica confirmación y desaparición de la fila. |

Por qué: el CRUD combina routing, auth, UI, HTTP mocks y estado. E2E cubre integración que los unit tests no ven.

## Paso 18: Verificar todo

Ejecutar antes de cerrar la feature:

```bash
npm run typecheck
npm test
npm run build
npm run e2e
```

Si tocaste estilos o markdown, también ejecutar:

```bash
npm run format:check
```

## Checklist final

- [ ] La feature vive en `src/app/features/categories`.
- [ ] La ruta final es `/app/categories` y se carga con `loadChildren`.
- [ ] `CategoriesPage` no importa `HttpClient`, DTOs ni repositories concretos.
- [ ] `CategoryFormComponent` emite inputs de dominio, no DTOs.
- [ ] `CategoryTableComponent` recibe `Category[]`, no `CategoryDto[]`.
- [ ] `CategoriesFacade` depende de `CATEGORY_REPOSITORY`, no de `CategoryHttpRepository`.
- [ ] `CategoryHttpRepository` es el único archivo que conoce `/api/v1/categories`.
- [ ] `CategoryMapper` cubre diferencias entre API y dominio.
- [ ] Las pruebas viven junto al archivo probado.
- [ ] No se agrego `any`, `as`, `@ts-ignore`, `standalone: true` ni `ChangeDetectionStrategy.OnPush` explicito.

## Errores que NO hay que cometer

| Error                                          | Por qué está mal                                              |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Crear `src/app/services/category.service.ts`   | Grita tecnología y mezcla responsabilidades.                  |
| Llamar `HttpClient` desde la página            | Acopla UI al backend y rompe Clean Architecture.              |
| Usar `CategoryDto` en componentes              | Filtra el contrato externo hacia presentación.                |
| Meter componentes de categoría en `shared`     | `shared` debe ser agnóstico del negocio.                      |
| Registrar todo en `main.ts` sin necesidad      | Aumenta el scope global y acopla bootstrap con features lazy. |
| Crear use cases para cada metodo sin necesidad | Puede ser ceremonia si la facade ya mantiene claro el flujo.  |

## Regla de evolucion

Empeza simple, pero con las fronteras correctas.

Para un CRUD de categoría, `CategoriesFacade + CategoryRepository + CategoryHttpRepository + CategoryMapper` suele ser suficiente. Si después aparecen permisos, validaciones complejas, reglas por estado, auditoría o flujos de aprobación, ahí sí conviene extraer use cases específicos.

La arquitectura buena no es la que tiene más capas. Es la que permite que el cambio correcto toque la menor cantidad de lugares posible.
