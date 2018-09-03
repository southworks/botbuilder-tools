/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
// tslint:disable:no-console
import { BotConfiguration, EndpointService, IEndpointService } from 'botframework-config';
import * as chalk from 'chalk';
import * as program from 'commander';
import * as getStdin from 'get-stdin';
import * as txtfile from 'read-text-file';
import * as validurl from 'valid-url';
import { uuidValidate } from './utils';

program.Command.prototype.unknownOption = (): void => {
    console.error(chalk.default.redBright(`Unknown arguments: ${process.argv.slice(2).join(' ')}`));
    showErrorHelp();
};

interface IConnectEndpointArgs extends IEndpointService {
    bot: string;
    secret: string;
    stdin: boolean;
    input?: string;
    [key: string]: string | boolean | undefined;
}

program
    .name('msbot connect endpoint')
    .description('Connect the bot to an endpoint')
    .option('-n, --name <name>', 'name of the endpoint')
    .option('-e, --endpoint <endpoint>', 'url for the endpoint\n')
    .option('-a, --appId  <appid>', '(OPTIONAL) Microsoft AppId used for auth with the endpoint')
    .option('-p, --appPassword <password>', '(OPTIONAL) Microsoft app password used for auth with the endpoint')

    .option('-b, --bot <path>', 'path to bot file.  If omitted, local folder will look for a .bot file')
    .option('--input <jsonfile>', 'path to arguments in JSON format { id:\'\',name:\'\', ... }')
    .option('--secret <secret>', 'bot file secret password for encrypting service secrets')
    .option('--stdin', 'arguments are passed in as JSON object via stdin')
    .action((cmd: program.Command, actions: program.Command) => undefined);

const args: IConnectEndpointArgs = {
    bot: '',
    secret: '',
    stdin: true,
    appId: '',
    appPassword: '',
    endpoint: '',
    tenantId: '',
    subscriptionId: '',
    resourceGroup: '',
    name: ''
};

const commands: program.Command = program.parse(process.argv);
for (const i of commands.args) {
    if (args.hasOwnProperty(i)) {
        args[i] = commands[i];
    }
}

if (process.argv.length < 3) {
    showErrorHelp();
} else {

    if (!args.bot) {
        BotConfiguration.loadBotFromFolder(process.cwd(), args.secret)
            .then(processConnectEndpointArgs)
            .catch((reason: Error) => {
                console.error(chalk.default.redBright(reason.toString().split('\n')[0]));
                showErrorHelp();
            });
    } else {
        BotConfiguration.load(args.bot, args.secret)
            .then(processConnectEndpointArgs)
            .catch((reason: Error) => {
                console.error(chalk.default.redBright(reason.toString().split('\n')[0]));
                showErrorHelp();
            });
    }
}

async function processConnectEndpointArgs(config: BotConfiguration): Promise<BotConfiguration> {
    if (args.stdin) {
        Object.assign(args, JSON.parse(await getStdin()));
    } else if (args.input != null) {
        Object.assign(args, JSON.parse(await txtfile.read(<string>args.input)));
    }

    if (!args.endpoint) {
        throw new Error('missing --endpoint');
    }

    if (!validurl.isHttpUri(args.endpoint) && !validurl.isHttpsUri(args.endpoint)) {
        throw new Error(`--endpoint ${args.endpoint} is not a valid url`);
    }

    if (args.appId && !uuidValidate(args.appId)) {
        throw new Error('--appId is not valid');
    }

    if (args.appPassword && args.appPassword.length === 0) {
        throw new Error('zero length --appPassword');
    }

    if (!args.hasOwnProperty('name')) {
        if (args.appId) {
            args.name = `${args.endpoint} - ${args.appId}`;
        } else {
            args.name = args.endpoint;
        }
    }

    const newService: IEndpointService = new EndpointService({
        name: args.name,
        appId: (args.appId && args.appId.length > 0) ? args.appId : '',
        appPassword: (args.appPassword && args.appPassword.length > 0) ? args.appPassword : '',
        endpoint: args.endpoint
    });

    const id: string = config.connectService(newService);
    await config.save(args.secret);
    process.stdout.write(JSON.stringify(config.findService(id), null, 2));

    return config;
}

function showErrorHelp(): void {
    program.outputHelp((str: string) => {
        console.error(str);

        return '';
    });
    process.exit(1);
}
