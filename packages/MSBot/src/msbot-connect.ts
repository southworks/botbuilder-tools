/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
// tslint:disable:no-console
import * as chalk from 'chalk';
import * as program from 'commander';

program.Command.prototype.unknownOption = (): void => {
    console.error(chalk.default.redBright(`Unknown arguments: ${process.argv.slice(2).join(' ')}`));
    showErrorHelp();
};

program
    .name('msbot connect')
    .command('appinsights', 'connect to Azure AppInsights')
    .command('blob', 'connect to Azure Blob storage')
    .command('bot', 'connect to Azure Bot Service')
    .command('cosmosdb', 'connect to Azure CosmosDB')
    .command('dispatch', 'connect to a Dispatch model')
    .command('endpoint', 'connect to endpoint')
    .command('file', 'connect to file to the bot')
    .command('generic', 'connect to generic service configuration')
    .command('luis', 'connect to a LUIS application')
    .command('qna', 'connect to QNA a service');

const args: program.Command = program.parse(process.argv);

// args should be undefined is subcommand is executed
if (args) {
    const a: string[] = process.argv.slice(2);
    console.error(chalk.default.redBright(`Unknown arguments: ${a.join(' ')}`));
    showErrorHelp();
}

function showErrorHelp(): void {
    program.outputHelp((str: string) => {
        console.error(str);

        return '';
    });
    process.exit(1);
}
