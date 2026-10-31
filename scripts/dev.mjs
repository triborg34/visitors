import { spawn } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const children = [];

function run(name, args, color) {
  const child = spawn(npm, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: isWindows });
  children.push(child);
  const prefix = '[' + name + ']';
  const write = (stream, data) => {
    const text = data.toString();
    for (const line of text.split(/\r?\n/)) {
      if (line.trim().length > 0) stream.write(color + prefix + ' ' + line + '\x1b[0m\n');
    }
  };
  child.stdout.on('data', (d) => write(process.stdout, d));
  child.stderr.on('data', (d) => write(process.stderr, d));
  child.on('exit', (code) => {
    console.log(color + prefix + ' exited with code ' + code + '\x1b[0m');
    shutdown();
  });
  return child;
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

run('server', ['run', 'dev', '--workspace', 'server'], '\x1b[36m');
run('client', ['run', 'dev', '--workspace', 'client'], '\x1b[35m');
