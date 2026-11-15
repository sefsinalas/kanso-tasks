import { test, expect } from '@playwright/test';

test.describe('Kanso Tasks Minimalist App E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('kanso_tasks_db');
    });
    await page.reload();
  });

  test('Criterio 3: Ver Backlog y Hoy simultáneamente en computadora', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Solo relevante para escritorio');

    await expect(page.getByTestId('backlog-column')).toBeVisible();
    await expect(page.getByTestId('today-column')).toBeVisible();
  });

  test('Criterios 1 y 2: Agregar tareas sin fecha y elegir 5 para Hoy con un clic', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba de flujo desktop');

    const backlogInput = page.getByTestId('backlog-input');
    // Agregar 5 tareas y confirmar cada una
    for (let i = 1; i <= 5; i++) {
      await backlogInput.fill(`Tarea de prueba ${i}`);
      await backlogInput.press('Enter');
      await expect(page.getByTestId('backlog-column').getByText(`Tarea de prueba ${i}`)).toBeVisible();
    }

    // Elegir 5 tareas para Hoy con un solo clic cada una
    const addButtons = page.getByTestId('btn-add-today');
    for (let i = 0; i < 5; i++) {
      await addButtons.nth(i).click();
    }

    // Verificar que el contador discreto de Hoy muestra "0 de 5"
    await expect(page.getByTestId('today-counter')).toContainText('0 de 5');

    // Verificar que las 5 tareas continúan existiendo en Backlog y en Hoy simultáneamente
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByTestId('backlog-column').getByText(`Tarea de prueba ${i}`)).toBeVisible();
      await expect(page.getByTestId('today-column').getByText(`Tarea de prueba ${i}`)).toBeVisible();
    }
  });

  test('Criterio 1: Puedo agregar 100 tareas a Backlog sin asignarles fechas', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba masiva en desktop');

    // Insertar 100 tareas directamente en IndexedDB con Promise y recargar
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('kanso_tasks_db', 1);
        req.onsuccess = (e: any) => {
          const db = e.target.result;
          const tx = db.transaction('tasks', 'readwrite');
          const store = tx.objectStore('tasks');
          const now = new Date().toISOString();
          for (let i = 1; i <= 100; i++) {
            store.put({
              id: `task_batch_${i}`,
              userId: 'guest_test',
              title: `Tarea masiva #${i}`,
              isSomeday: false,
              sortOrder: i * 10,
              completedAt: null,
              createdAt: now,
              updatedAt: now,
              deletedAt: null
            });
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    await page.reload();

    // Verificar que el contador de pendientes muestra 100
    await expect(page.getByText('Pendientes (100)')).toBeVisible();
    await expect(page.getByText('Tarea masiva #1', { exact: true })).toBeVisible();
  });

  test('Criterio 5: Si saco una tarea de Hoy, sigue en Backlog', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba de flujo desktop');

    const backlogInput = page.getByTestId('backlog-input');
    await backlogInput.fill('Tarea para quitar');
    await backlogInput.press('Enter');

    // Agregar a Hoy
    const taskRow = page.getByTestId('backlog-column').locator('div', { hasText: 'Tarea para quitar' }).first();
    await taskRow.getByTestId('btn-add-today').click();

    // Debe estar en Mi Día
    await expect(page.getByTestId('today-column').getByText('Tarea para quitar')).toBeVisible();

    // Sacar de Hoy clickeando Quitar
    await page.getByTestId('today-column').getByTestId('btn-remove-today').first().click();

    // Ya no debe estar en Mi Día
    await expect(page.getByTestId('today-column').getByText('Tarea para quitar')).not.toBeVisible();

    // Pero DEBE seguir existiendo en Backlog
    await expect(page.getByTestId('backlog-column').getByText('Tarea para quitar')).toBeVisible();
  });

  test('Criterio 6: Si completo una tarea, aparece en Completadas / Historial y se puede restaurar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba de flujo desktop');

    const todayInput = page.getByTestId('today-input');
    await todayInput.fill('Tarea para completar');
    await todayInput.press('Enter');

    // Marcar como completada en Hoy
    const checkbox = page.getByTestId('today-column').getByTestId('btn-toggle-complete').first();
    await checkbox.click();

    // Abrir Historial en Desktop
    await page.getByRole('button', { name: 'Historial' }).click();

    // Debe estar en Historial
    await expect(page.getByText('Tarea para completar')).toBeVisible();

    // Restaurar tarea
    await page.getByRole('button', { name: 'Restaurar' }).first().click();

    // Volver a vista dividida
    await page.getByRole('button', { name: /Vista Dividida/i }).click();

    // Debe volver a estar en Backlog
    await expect(page.getByTestId('backlog-column').getByText('Tarea para completar')).toBeVisible();
  });

  test('Criterio 10: En móvil, pantalla inicial es Hoy y navegación por pestañas funciona', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo relevante para móvil');

    // 1. La pantalla inicial en móvil es Hoy
    await expect(page.getByRole('heading', { name: 'Mi Día' })).toBeVisible();

    // 2. Navegar a Backlog mediante la barra inferior
    await page.getByTestId('tab-backlog').click();
    await expect(page.getByRole('heading', { name: 'Lista Maestra' })).toBeVisible();

    // Crear tarea en Backlog móvil
    const input = page.getByTestId('backlog-input');
    await input.fill('Tarea desde móvil');
    await input.press('Enter');

    await expect(page.getByText('Tarea desde móvil')).toBeVisible();

    // Agregar a Hoy
    await page.getByTestId('btn-add-today').first().click();

    // Volver a Hoy
    await page.getByTestId('tab-today').click();
    await expect(page.getByRole('heading', { name: 'Mi Día' })).toBeVisible();
    await expect(page.getByText('Tarea desde móvil')).toBeVisible();
  });

  test('Criterio 9: Cerrar y volver a abrir (recargar) conserva toda la información', async ({ page, isMobile }) => {
    const uniqueTitle = `Persistencia test ${Date.now()}`;
    const input = isMobile ? page.getByTestId('today-input') : page.getByTestId('backlog-input');
    await input.fill(uniqueTitle);
    await input.press('Enter');

    await expect(page.getByText(uniqueTitle)).toBeVisible();

    // Recargar la página
    await page.reload();

    // Debe continuar presente
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

});
