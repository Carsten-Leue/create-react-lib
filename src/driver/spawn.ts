const spawn = require('cross-spawn');

export function spawnFile(aName: string, aArgs: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const buffer: string[] = [];

    const child = spawn(aName, aArgs, {
      stdio: ['inherit', 'pipe', 'inherit']
    });
    child.stdout.on('data', data => {
      buffer.push(data.toString());
    });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${aName} ${aArgs.join(' ')}`
        });
        return;
      }
      resolve(buffer.join(''));
    });
  });
}
