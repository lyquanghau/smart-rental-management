import { EventEmitter } from 'node:events';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import childProcess from 'node:child_process';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import process from 'node:process';

const originalExec = childProcess.exec;

function createSkippedChildProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = null;
  child.killed = true;
  child.pid = 0;
  child.kill = () => true;
  return child;
}

childProcess.exec = function patchedExec(command, options, callback) {
  const normalizedCommand = String(command).trim().toLowerCase();

  if (process.platform === 'win32' && normalizedCommand === 'net use') {
    const done = typeof options === 'function' ? options : callback;
    const child = createSkippedChildProcess();

    process.nextTick(() => {
      done?.(new Error('Skipped Windows network drive lookup'), '', '');
      child.emit('exit', 0);
      child.emit('close', 0);
    });

    return child;
  }

  return originalExec.apply(this, arguments);
};

syncBuiltinESMExports();

const require = createRequire(import.meta.url);
const vitePackageJson = require.resolve('vite/package.json');
const viteBin = path.join(path.dirname(vitePackageJson), 'bin', 'vite.js');

process.argv = [process.argv[0], viteBin, ...process.argv.slice(2)];
await import(pathToFileURL(viteBin));
