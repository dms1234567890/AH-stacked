const { spawn } = require('node:child_process');
const { resolve } = require('node:path');

const rootDirectory = resolve(__dirname, '..');
process.loadEnvFile(resolve(rootDirectory, '.env'));

const postgresUser = process.env.POSTGRES_USER || 'prime';
const postgresPassword = process.env.POSTGRES_PASSWORD || 'change-this-local-password';
const postgresDatabase = process.env.POSTGRES_DB || 'prime_academic_manager';
const postgresPort = process.env.LOCAL_POSTGRES_PORT || '5433';
const localDatabaseUrl =
  `postgresql://${encodeURIComponent(postgresUser)}:${encodeURIComponent(postgresPassword)}` +
  `@127.0.0.1:${postgresPort}/${encodeURIComponent(postgresDatabase)}?schema=public`;

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const backend = spawn(command, ['run', 'start:dev'], {
  cwd: resolve(rootDirectory, 'apps', 'backend'),
  env: {
    ...process.env,
    DATABASE_URL: localDatabaseUrl,
    PORT: process.env.PORT || '3001',
  },
  stdio: 'inherit',
});

backend.on('error', (error) => {
  console.error(`Unable to start the local backend: ${error.message}`);
  process.exitCode = 1;
});

backend.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
