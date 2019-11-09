import { Command } from 'commander';

import { createApplication } from './create.app';

const NAME = 'create-react-lib';

function createProgram(): [string, Command] {
  let projectName = 'defaultProject';

  const program = new Command(NAME)
    .arguments('<project-directory>')
    .usage('<project-directory> [options]')
    .action((name) => {
      projectName = name;
    })
    .option('--verbose', 'print additional logs')
    .option('--carbon', 'include support for Carbon components')
    .option('--use-npm')
    .allowUnknownOption()
    .parse(process.argv);

  return [projectName, program];
}

export function createApp() {
  // parse
  const [programName, cmd] = createProgram();
  // default
  return createApplication(
    programName,
    !!cmd.useNpm,
    !!cmd.carbon
  ).then(() => {}, (error) => console.error(error));
}
