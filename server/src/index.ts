import { createApp } from './app';
import { config } from './config/env';
import { disconnectPrisma, enableSqlitePragmas } from './config/prisma';

async function main() {
  await enableSqlitePragmas();
  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    console.log(
      '[server] Amnafarinan visitor-management API listening on http://' +
        config.host +
        ':' +
        config.port +
        ' (' +
        config.env +
        ')',
    );
  });

  const shutdown = async (signal: string) => {
    console.log('[server] ' + signal + ' received, shutting down...');
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('[server] startup failed:', error);
  process.exit(1);
});
