import { spawn, sync } from 'cross-spawn';
import { mkdir, readdir, readFile, rename, writeFile } from 'fs-extra';
import { basename, join, parse, resolve } from 'path';
import { cwd } from 'process';

import { install } from './install';
import { spawnFile } from './spawn';

function shouldUseYarn() {
  try {
    sync('yarn --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

const BASE_PACKAGES = [
  'cpx',
  'rxjs',
  'zone.js',
  'ng-packagr',
  '@angular/compiler',
  '@angular/compiler-cli',
  '@angular/core'
];
const CARBON_PACKAGES = [
  '@types/carbon-components-react',
  'carbon-components-react',
  'carbon-components',
  'carbon-icons',
  'prop-types'
];

function renameStyle(aFile: string) {
  // parse
  const { dir, name } = parse(aFile);
  const dst = join(dir, `${name}.scss`);
  return rename(aFile, dst);
}

function rewriteTsx(aFile: string) {
  return readFile(aFile, 'utf-8')
    .then(data => data.replace(/(\.css)/gm, '.scss'))
    .then(data => writeFile(aFile, data));
}

export function rewriteFiles(aRoot: string) {
  // source dir
  const src = join(aRoot, 'src');
  // list the files
  const files$ = readdir(src);
  const styles$ = files$
    .then(files => files.filter(name => name.endsWith('.css')))
    .then(files => files.map(name => join(src, name)));
  const tsx$ = files$
    .then(files => files.filter(name => name.endsWith('.tsx')))
    .then(files => files.map(name => join(src, name)));
  // rename styles
  const renStyles$ = styles$.then(files => Promise.all(files.map(renameStyle)));
  // rewrite tsx
  const rewriteTsx$ = tsx$.then(files => Promise.all(files.map(rewriteTsx)));
  // gitignore
  const gitignore = join(aRoot, '.gitignore');
  const gitignore$ = readFile(gitignore, 'utf-8')
    .then(data => data + '\n# library\n/dist\n')
    .then(data => writeFile(gitignore, data));
  // wait for all
  return Promise.all([renStyles$, rewriteTsx$, gitignore$]);
}

function fixPackage(aPkg: any, aUseCarbon: boolean) {
  // move all dependencies
  const dependencies = {};
  const devDependencies = aPkg.devDependencies || {};
  const peerDependencies = aPkg.peerDependencies || {};
  // move all deps to devDeps
  const origDep = aPkg.dependencies || {};
  Object.keys(origDep).forEach(key => (devDependencies[key] = origDep[key]));
  // add the dependencies
  const umdModuleIds = {
    react: 'React',
    'react-dom': 'ReactDOM'
  };
  if (aUseCarbon) {
    umdModuleIds['carbon-components-react'] = 'CarbonComponentsReact';
    umdModuleIds['carbon-components'] = 'CarbonComponents';
  }
  aPkg['ngPackage'] = {
    lib: {
      umdModuleIds,
      jsx: 'react'
    }
  };
  // add peer deps
  peerDependencies['react'] = devDependencies['react'];
  peerDependencies['react-dom'] = devDependencies['react-dom'];
  // carbon dependencies
  if (aUseCarbon) {
    peerDependencies['carbon-components-react'] =
      devDependencies['carbon-components-react'];
    peerDependencies['carbon-components'] =
      devDependencies['carbon-components'];
  }
  // add scripts
  const scripts = aPkg.scripts || {};
  // add the scripts
  scripts['build'] = 'ng-packagr -p package.json';
  scripts['postbuild'] = 'cpx "src/lib/**/*.scss" ./dist';
  // ok
  return { ...aPkg, dependencies, devDependencies, peerDependencies, scripts };
}

export function rewritePackage(aRoot: string, aUseCarbon: boolean) {
  // load the package
  const name = join(aRoot, 'package.json');
  return readFile(name, 'utf-8')
    .then(data => JSON.parse(data))
    .then(pkg => fixPackage(pkg, aUseCarbon))
    .then(pkg => JSON.stringify(pkg, undefined, 2))
    .then(data => writeFile(name, data));
}

export function createFiles(aRoot: string) {
  // lib folder
  const src = join(aRoot, 'src');
  const lib = join(src, 'lib');
  const components = join(lib, 'components');
  const scss = join(lib, 'scss');
  const lib$ = mkdir(lib);
  const components$ = lib$.then(() => mkdir(components));
  const scss$ = lib$.then(() => mkdir(scss));
  // index from lib
  const index = join(lib, 'index.ts');
  const index$ = lib$.then(() =>
    writeFile(index, "export * from './components/index';")
  );
  // index from component
  const indexCmd = join(components, 'index.ts');
  const indexCmd$ = components$.then(() =>
    writeFile(indexCmd, '// export components here\nexport const DUMMY = 0;')
  );
  // construct some target files
  const indexScss = join(scss, 'index.scss');
  const indexScss$ = scss$.then(() =>
    writeFile(indexScss, "@import './../components/index';")
  );
  // construct some target files
  const indexScssCmp = join(components, 'index.scss');
  const indexScssCmp$ = components$.then(() =>
    writeFile(indexScssCmp, '// import styles here')
  );
  // public API
  const publicApi = join(src, 'public_api.ts');
  const publicApi$ = writeFile(publicApi, "export * from './lib/index';");

  // all files
  const all = [
    lib$,
    scss$,
    components$,
    index$,
    indexCmd$,
    indexScss$,
    publicApi$,
    indexScssCmp$
  ];

  // create all artifacts
  return Promise.all(all);
}

function readJson(aName: string) {
  return readFile(aName, 'utf-8').then(data => JSON.parse(data));
}

function writeJson(aName: string, aPkg: any) {
  return writeFile(aName, JSON.stringify(aPkg, undefined, 2));
}

function updateTypescriptVersion(aKey: string, aVersion: string, aDeps: any) {
  const old = aDeps[aKey];
  if (old) {
    aDeps[aKey] = aVersion;
  }
}

function findTypescriptVersion(): Promise<string> {
  // run
  return spawnFile('npm', [
    'show',
    '@angular/compiler-cli',
    'peerDependencies.typescript'
  ]).then(result => result.trim());
}

function fixTypescriptVersion(aPkg: any, aVersion: string) {
  aPkg.dependencies['typescript'] = aVersion;
  return aPkg;
}

export function rewriteTypescriptVersion(aRoot: string) {
  // load the package
  const name = join(aRoot, 'package.json');
  // read json and load version
  const pkg$ = readJson(name);
  const tsVersion$ = findTypescriptVersion();
  // combine
  return Promise.all([pkg$, tsVersion$])
    .then(([pkg, tsVersion]) => fixTypescriptVersion(pkg, tsVersion))
    .then(pkg => writeJson(name, pkg));
}

function createReactApp(aAppName: string, aRoot: string, aUseYarn: boolean) {
  // command
  const command = aUseYarn ? 'yarn' : 'npx';
  const args = aUseYarn ? ['create', 'react-app'] : ['create-react-app'];
  args.push(aAppName, '--typescript');

  const app$ = new Promise((resolve, reject) => {
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
  // done
  return app$.then(() => rewriteTypescriptVersion(aRoot));
}

export function createApplication(
  aName: string,
  aUseNpm: boolean,
  aUseCarbon: boolean
) {
  const root = resolve(aName);
  const appName = basename(root);

  const useYarn = aUseNpm ? false : shouldUseYarn();
  const originalDirectory = cwd();

  // packages to install
  const packages = [...BASE_PACKAGES];
  if (aUseCarbon) {
    packages.push(...CARBON_PACKAGES);
  }

  // create the app
  const app$ = createReactApp(appName, root, useYarn);
  // install the packages
  const installed$ = app$.then(() => install(root, useYarn, packages));
  // fix the css
  const css$ = installed$.then(() => rewriteFiles(root));
  // fix the package
  const pkg$ = installed$.then(() => rewritePackage(root, aUseCarbon));
  // create default files
  const files$ = installed$.then(() => createFiles(root));
  // done
  return Promise.all([app$, installed$, css$, pkg$, files$]);
}
