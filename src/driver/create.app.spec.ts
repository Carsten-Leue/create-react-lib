import { copy, remove } from 'fs-extra';
import { tmpdir } from 'os';
import { join } from 'path';

import { ASSETS } from '../utils/assets';
import { rewriteTypescriptVersion } from './create.app';

describe('create.app', () => {
  const DST_DIR = join(tmpdir(), 'create.app');
  const ROOT_DIR = join(ASSETS, 'create-react-app');

  fit('should fix the typescript version', () => {
    // test copy
    const delDir = () => remove(DST_DIR);
    // copy dir
    const copyDir = () => copy(ROOT_DIR, DST_DIR);
    // rewrite
    const rewrite = () => rewriteTypescriptVersion(DST_DIR);    

    const result$ = delDir().then(copyDir).then(rewrite);

    return result$;
  }, 10000);

/*  it('should create files', (done) => {
    // test copy
    const deleted$ = rxDeleteDir(DST_DIR);
    const copied$ = rxPipe(
      deleted$,
      mergeMapTo(rxCopyDir(ROOT_DIR, DST_DIR, true))
    );
    const pkg$ = rxPipe(copied$, count(), mergeMap(() => createFiles(DST_DIR)));

    pkg$.subscribe(console.log, done, () => done());
  });

  it('should rewrite package', (done) => {
    // test copy
    const deleted$ = rxDeleteDir(DST_DIR);
    const copied$ = rxPipe(
      deleted$,
      mergeMapTo(rxCopyDir(ROOT_DIR, DST_DIR, true))
    );
    const pkg$ = rxPipe(
      copied$,
      count(),
      mergeMap(() => rewritePackage(DST_DIR, true))
    );

    pkg$.subscribe(console.log, done, () => done());
  });

  it('should rename the CSS files', (done) => {
    // test copy
    const deleted$ = rxDeleteDir(DST_DIR);
    const copied$ = rxPipe(
      deleted$,
      mergeMapTo(rxCopyDir(ROOT_DIR, DST_DIR, true))
    );
    const css$ = rxPipe(
      copied$,
      count(),
      mergeMap(() => rewriteFiles(DST_DIR))
    );

    css$.subscribe(console.log, done, () => done());
  }); */
});
