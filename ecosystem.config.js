module = {
  apps: [
    {
      name: 'prime-backend',
      script: 'apps/backend/dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
    },
    {
      name: 'prime-frontend',
      cwd: 'apps/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:3001/api/v1',
      },
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
    },
  ],
};
