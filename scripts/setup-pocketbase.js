// Script to configure PocketBase collections on the Orange Pi instance
import PocketBase from 'pocketbase';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://pleasant-pelican-present.ngrok-free.app';
const pb = new PocketBase(PB_URL);

// Ngrok header
pb.beforeSend = function (url, options) {
  options.headers = Object.assign({}, options.headers, {
    'ngrok-skip-browser-warning': 'true',
  });
  return { url, options };
};

async function main() {
  console.log(`Connecting to PocketBase at: ${PB_URL}`);

  try {
    // Authenticate as superuser
    await pb.collection('_superusers').authWithPassword('admin@ygo.local', 'songoku123');
    console.log('Authenticated as superuser successfully!');

    // Check existing collections
    const collections = await pb.collections.getFullList();
    const existingNames = collections.map(c => c.name);
    console.log('Existing collections:', existingNames);

    // 1. Create or update `tasks` collection
    if (!existingNames.includes('tasks')) {
      console.log('Creating "tasks" collection...');
      await pb.collections.create({
        name: 'tasks',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
        fields: [
          { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: true, maxSelect: 1 },
          { name: 'title', type: 'text', required: true },
          { name: 'notes', type: 'text', required: false },
          { name: 'due_date', type: 'text', required: false },
          { name: 'is_someday', type: 'bool', required: false },
          { name: 'sort_order', type: 'number', required: false },
          { name: 'completed_at', type: 'text', required: false },
          { name: 'deleted_at', type: 'text', required: false },
        ]
      });
      console.log('Created "tasks" collection.');
    } else {
      console.log('"tasks" collection already exists.');
    }

    // 2. Create or update `daily_selections` collection
    if (!existingNames.includes('daily_selections')) {
      console.log('Creating "daily_selections" collection...');
      await pb.collections.create({
        name: 'daily_selections',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
        fields: [
          { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', cascadeDelete: true, maxSelect: 1 },
          { name: 'task_id', type: 'text', required: true },
          { name: 'selected_date', type: 'text', required: true },
          { name: 'sort_order', type: 'number', required: false },
          { name: 'deleted_at', type: 'text', required: false },
        ],
        indexes: [
          'CREATE UNIQUE INDEX `idx_daily_user_task_date` ON `daily_selections` (`user`, `task_id`, `selected_date`) WHERE `deleted_at` IS NULL OR `deleted_at` = ""'
        ]
      });
      console.log('Created "daily_selections" collection.');
    } else {
      console.log('"daily_selections" collection already exists.');
    }

    console.log('PocketBase configuration completed successfully!');
  } catch (err) {
    console.error('Error configuring PocketBase:', err);
  }
}

main();
