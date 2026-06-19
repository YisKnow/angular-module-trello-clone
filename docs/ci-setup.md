# CI Setup — Branch Protection para GitHub

## ¿Qué hace el workflow?

El archivo `.github/workflows/ci.yml` corre automáticamente en cada **PR a `main`** y cada **push a `main`**:

1. `npm ci` — instala dependencias exactas
2. `npm run lint` — verifica que no haya errores de lint
3. `npm run test:coverage` — corre los tests y verifica los thresholds de cobertura

Si la cobertura baja del mínimo, el workflow falla y el check se marca como rojo.

## Activar el bloqueo en GitHub

Para que GitHub **bloquee el merge** si el workflow falla:

1. Ir al repo en GitHub
2. **Settings → Branches**
3. Del lado derecho, en **Branch protection rules**, click en **Add rule** (o editá la regla existente para `main`)
4. En **Protect matching branches**, escribí `main`
5. Marcá **Require status checks before merging**
6. En la caja de búsqueda que aparece abajo, empezá a escribir `test`
7. Seleccioná el check **test** (debe haber corrido al menos una vez en el repo para aparecer)
8. Guardá

A partir de ahí, si un PR baja la cobertura, el workflow falla y el merge queda bloqueado.

## Umbrales actuales

Definidos en `vitest.config.ts`:

| Métrica | Mínimo |
|---|---|
| Lines | 80% |
| Statements | 78% |
| Functions | 78% |
| Branches | 65% |

Se pueden ajustar editando `vitest.config.ts` en la sección `coverage.thresholds`.
