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

  test('Criterio: Vista unificada con Hoy arriba y Lista Maestra abajo (sin tabs ni búsqueda)', async ({ page }) => {
    await expect(page.getByTestId('today-section')).toBeVisible();
    await expect(page.getByTestId('backlog-section')).toBeVisible();
    await expect(page.getByTestId('toggle-history-btn')).toBeVisible();
  });

  test('Smart Tags con #: agregar con #hoy, #mañana y #someday por teclado', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');

    // 1. Tarea con #hoy debe ir directamente a la sección Hoy arriba
    await taskInput.fill('Hacer compras del súper #hoy');
    await taskInput.press('Enter');
    await expect(taskInput).toHaveValue('');
    await expect(page.getByTestId('today-section').getByText('Hacer compras del súper')).toBeVisible();

    // 2. Tarea con #mañana debe mostrar el badge de fecha Mañana
    await taskInput.fill('Renovar póliza de seguro #mañana');
    await taskInput.press('Enter');
    await expect(taskInput).toHaveValue('');
    await expect(page.getByTestId('backlog-section').getByText('Renovar póliza de seguro')).toBeVisible();
    await expect(page.getByText('Mañana')).toBeVisible();

    // 3. Tarea con #someday debe ir a la lista de Algún Día
    await taskInput.fill('Aprender a tocar violín #someday');
    await taskInput.press('Enter');
    await expect(taskInput).toHaveValue('');

    // Cambiar a pestaña Algún día
    await page.getByRole('button', { name: /Algún día/i }).click();
    await expect(page.getByText('Aprender a tocar violín')).toBeVisible();
  });

  test('Criterios 1 y 2: Agregar tareas sin fecha y elegir 5 para Hoy con un clic', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');
    // Agregar 5 tareas y confirmar cada una
    for (let i = 1; i <= 5; i++) {
      await taskInput.fill(`Tarea de prueba ${i}`);
      await taskInput.press('Enter');
      await expect(taskInput).toHaveValue('');
      await expect(page.getByTestId('backlog-section').getByText(`Tarea de prueba ${i}`)).toBeVisible();
    }

    // Elegir 5 tareas para Hoy con un solo clic cada una en la Lista Maestra
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('backlog-section').getByTestId('btn-add-today').first().click();
    }

    // Verificar que el contador discreto de Hoy muestra "0 de 5"
    await expect(page.getByTestId('today-counter')).toContainText('0 de 5');

    // Verificar que las 5 tareas ahora aparecen arriba en la sección Hoy
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByTestId('today-section').getByText(`Tarea de prueba ${i}`)).toBeVisible();
    }
  });

  test('Criterio 1: Puedo agregar 100 tareas a Backlog sin asignarles fechas', async ({ page }) => {
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

    // Verificar que la lista maestra muestra las 100 tareas
    await expect(page.getByText('Lista (100)')).toBeVisible();
    await expect(page.getByText('Tarea masiva #1', { exact: true })).toBeVisible();
  });

  test('Criterio 5: Si saco una tarea de Hoy, vuelve a la Lista Maestra abajo', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');
    await taskInput.fill('Tarea para quitar');
    await taskInput.press('Enter');

    // Agregar a Hoy
    const taskRow = page.getByTestId('backlog-section').locator('div', { hasText: 'Tarea para quitar' }).first();
    await taskRow.getByTestId('btn-add-today').click();

    // Debe subir a la sección Hoy
    await expect(page.getByTestId('today-section').getByText('Tarea para quitar')).toBeVisible();

    // Sacar de Hoy clickeando Quitar
    await page.getByTestId('today-section').getByTestId('btn-remove-today').first().click();

    // Ya no debe estar en Hoy
    await expect(page.getByTestId('today-section').getByText('Tarea para quitar')).not.toBeVisible();

    // Pero DEBE volver a estar abajo en la Lista Maestra
    await expect(page.getByTestId('backlog-section').getByText('Tarea para quitar')).toBeVisible();
  });

  test('Criterio 6: Si completo una tarea, aparece en el Historial del fondo y se puede restaurar', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');
    await taskInput.fill('Tarea para completar');
    await taskInput.press('Enter');

    // Marcar como completada
    const checkbox = page.getByTestId('backlog-section').getByTestId('btn-toggle-complete').first();
    await checkbox.click();

    // Abrir Historial en el fondo
    await page.getByTestId('toggle-history-btn').click();

    // Debe estar en el Historial
    await expect(page.getByTestId('history-section').getByText('Tarea para completar')).toBeVisible();

    // Restaurar tarea
    await page.getByTestId('btn-restore-task').first().click();

    // Debe volver a estar en la Lista Maestra
    await expect(page.getByTestId('backlog-section').getByText('Tarea para completar')).toBeVisible();
  });

  test('Criterio 9: Cerrar y volver a abrir (recargar) conserva toda la información', async ({ page }) => {
    const uniqueTitle = `Persistencia test ${Date.now()}`;
    const input = page.getByTestId('task-input');
    await input.fill(uniqueTitle);
    await input.press('Enter');
    await expect(input).toHaveValue('');

    await expect(page.getByText(uniqueTitle)).toBeVisible();

    // Recargar la página
    await page.reload();

    // Debe continuar presente
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

});
