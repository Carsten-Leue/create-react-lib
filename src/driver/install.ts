import { spawn } from 'cross-spawn';

/**
 * Performs an install of the packages
 *
 * @param root
 * @param useYarn
 * @param dependencies
 */
export function install(
  root: string,
  useYarn: boolean,
  dependencies: string[]
) {
  return new Promise((resolve, reject) => {
    let command;
    let args;
    if (useYarn) {
      command = 'yarn';
      args = ['add', '--cwd', root, '-D', ...dependencies];
    } else {
      command = 'npm';
      args = ['install', '--save-dev', ...dependencies];
    }

    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`
        });
        return;
      }
      resolve();
    });
  });
}
