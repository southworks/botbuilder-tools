/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
import * as chalk from 'chalk';
import * as program from 'commander';
import * as fsx from 'fs-extra';
import * as readline from 'readline-sync';
import { BotConfig } from './BotConfig';
import { IEndpointService, ServiceType } from './schema';

program.Command.prototype.unknownOption = function (flag: any) {
    console.error(chalk.default.redBright(`Unknown arguments: ${flag}`));
    program.help();
};

interface InitArgs {
    name: string;
    description: string;
    secret: string;
    endpoint: string;
    appId: string;
    appPassword: string;
    quiet: boolean;
}

program
    .name('msbot init')
    .option('--secret <secret>', 'secret used to encrypt service keys')
    .option('-n, --name <name>', 'name of the bot')
    .option('-d, --description <description>', 'description of the bot')
    .option('-a, --appId  <appid>', 'Microsoft AppId used for auth with the endpoint')
    .option('-p, --appPassword <password>', 'Microsoft app password used for auth with the endpoint')
    .option('-e, --endpoint <endpoint>', 'local endpoint for the bot')
    .option('-q, --quiet', 'do not prompt')
    .action((name, x) => {
        console.log(name);
    });

const args: InitArgs = <InitArgs><any>program.parse(process.argv);

if (!args.quiet) {

    let exists = fsx.existsSync(`${args.name}.bot`);
    while (((!args.hasOwnProperty('name') || args.name.length === 0)) || exists) {
        if (exists) {
            console.log(`${args.name}.bot already exists`);
        }
        args.name = readline.question(`What name would you like for your bot? `);
        exists = fsx.existsSync(`${args.name}.bot`);
    }

    if (!args.secret || args.secret.length === 0) {
        const answer = readline.question(`Would you to secure your bot keys with a secret? [no]`);
        if (answer === 'y' || answer === 'yes') {
            args.secret = readline.question(`What secret would you like to use? `);
        }
    }

    if (!args.description || args.description.length === 0) {
        args.description = readline.question(`What description would you like for your bot? `);
    }

    while (!args.endpoint || args.endpoint.length === 0) {
        args.endpoint = readline.question(`What localhost endpoint does your bot use for debugging [Example: http://localhost:3978/api/messages]? `, {
            defaultInput: `http://localhost:3978/api/messages`
        });
    }

    if (!args.appId || args.appId.length === 0) {
        const answer = readline.question(`Do you have an Application Id for this bot? [no] `, {
            defaultInput: 'no'
        });
        if (answer === 'y' || answer === 'yes') {
            args.appId = readline.question(`What is your Application Id? [none] `, {
                defaultInput: ''
            });
        }
    }

    while (args.appId && args.appId.length > 0 && (!args.appPassword || args.appPassword.length === 0)) {
        args.appPassword = readline.question(`What is your Msa Application password for ${args.appId}? `, {
            defaultInput: ''
        });
    }
}

if (!args.name) {
    console.error('missing --name argument');
} else {
    const bot = new BotConfig(args.secret);
    bot.name = args.name;
    bot.description = args.description;

    bot.connectService(<IEndpointService>{
        type: ServiceType.Endpoint,
        name: args.name,
        endpoint: args.endpoint,
        description: args.description,
        id: args.endpoint,
        appId: args.appId || '',
        appPassword: args.appPassword || ''
    });

    if (args.secret && args.secret.length > 0) {
        bot.validateSecretKey();
    }

    const filename = bot.name + '.bot';
    bot.save(filename);
    console.log(`${filename} created`);

}
