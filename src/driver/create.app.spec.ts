import { copy, remove } from 'fs-extra';
import { tmpdir } from 'os';
import { join } from 'path';

import { ASSETS } from '../utils/assets';
import {
  rewriteTypescriptVersion,
  createFiles,
  rewritePackage,
  rewriteFiles
} from './create.app';

describe('create.app', () => {
  const DST_DIR = join(tmpdir(), 'create.app');
  const ROOT_DIR = join(ASSETS, 'create-react-app');

  const TIMEOUT = 20000;

  // test copy
  const delDir = () => remove(DST_DIR);
  // copy dir
  const copyDir = () => copy(ROOT_DIR, DST_DIR);

  it(
    'should fix the typescript version',
    () => {
      // rewrite
      const rewrite = () => rewriteTypescriptVersion(DST_DIR);

      const result$ = delDir()
        .then(copyDir)
        .then(rewrite);

      return result$;
    },
    TIMEOUT
  );

  it(
    'should create files',
    () => {
      // create files
      const create = () => createFiles(DST_DIR);

      const result$ = delDir()
        .then(copyDir)
        .then(create);

      return result$;
    },
    TIMEOUT
  );

  it(
    'should rewrite package',
    () => {
      // rewrite
      const rewrite = () => rewritePackage(DST_DIR, true);

      const result$ = delDir()
        .then(copyDir)
        .then(rewrite);

      return result$;
    },
    TIMEOUT
  );

  it(
    'should rename the CSS files',
    () => {
      // rewrite css files
      const rewrite = () => rewriteFiles(DST_DIR);
      const result$ = delDir()
        .then(copyDir)
        .then(rewrite);

      return result$;
    },
    TIMEOUT
  );
});
