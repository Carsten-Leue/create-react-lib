import { Command } from 'commander';
import { createApplication } from './create.app';


const NAME = 'create-react-lib';

class CreateReactAppCommand extends Command {
  useNpm?: boolean;

  carbon?: boolean;

  storybook?: boolean;

  constructor(name: string) {
    super(name);
  }
}

function createProgram(): [string, CreateReactAppCommand] {
  let projectName = 'defaultProject';

  const program: CreateReactAppCommand = new CreateReactAppCommand(NAME)
    .arguments('<project-directory>')
    .usage('<project-directory> [options]')
    .action((name) => {
      projectName = name;
    })
    .option('--verbose', 'print additional logs')
    .option('--carbon', 'include support for Carbon components')
    .option('--storybook', 'include support for storybook')
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
    !!cmd.carbon,
    !!cmd.storybook
  ).then(
    () => {},
    (error) => console.error(error)
  );
}
