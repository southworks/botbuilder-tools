/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
// tslint:disable:no-console
// tslint:disable:no-object-literal-type-assertion
import {
    AppInsightsService, BlobStorageService, BotConfiguration,
    BotRecipe, BotService, CosmosDbService, DispatchService, EndpointService,
    FileService, GenericService, IBlobResource, IBotService,
    ICosmosDBResource, IDispatchResource, IDispatchService,
    IEndpointService, IFileResource, IGenericResource,
    ILuisService, IQnAService, IUrlResource, ServiceTypes
    } from 'botframework-config';
import * as chalk from 'chalk';
import * as child_process from 'child_process';
import * as program from 'commander';
import * as process from 'process';
import * as txtfile from 'read-text-file';
import * as url from 'url';
import * as util from 'util';
import { spawnAsync } from './processUtils';
// tslint:disable-next-line:no-var-requires no-require-imports
const opn: Function = require('opn');
const exec: Function = util.promisify(child_process.exec);

program.Command.prototype.unknownOption = (flag: string): void => {
    console.error(chalk.default.redBright(`Unknown arguments: ${flag}`));
    program.help();
};

interface ICloneArgs {
    name: string;
    folder: string;
    location: string;
    subscriptionId: string;
    tenantId: string;
    groupName: string;
    secret: string;
    quiet: boolean;
    verbose: boolean;
    luisAuthoringKey: string;
    luisSubscriptionKey: string;
    qnaSubscriptionKey: string;
    luisRegion: string;
    args: string[];
}

program
    .name('msbot clone')
    .option('-n, --name <name>', 'name of new bot')
    .option('-f, --folder <folder>', 'path to folder containing exported resources')
    .option('-l, --location <location>', 'location to create the bot service in (westus, ...)')
    .option('--luisAuthoringKey <luisAuthoringKey>', 'authoring key for creating luis resources')
    .option('--subscriptionId <subscriptionId>',
            '(OPTIONAL) Azure subscriptionId to clone bot to, if not passed then current az account will be used')
    .option('--groupName <groupName>',
            '(OPTIONAL) groupName for cloned bot, if not passed then new bot name will be used for the new group')
    .option('--verbose', 'show verbose information')
    .option('-q, --quiet', 'disable output')
    .description('allows you to clone a bot with a new configuration')
    .action((cmd: program.Command, actions: program.Command) => undefined);
program.parse(process.argv);

const commandArguments: program.Command = program.parse(process.argv);
const args: ICloneArgs = <ICloneArgs>{};
Object.assign(args, commandArguments);

if (typeof (args.name) !== 'string') {
    console.error(chalk.default.redBright('missing --name argument'));
    showErrorHelp();
}

const config: BotConfiguration = new BotConfiguration();
config.name = args.name;
config.saveAs(`${config.name}.bot`)
    .then(processConfiguration)
    .catch((reason: Error) => {
        console.error(chalk.default.redBright(reason.toString().split('\n')[0]));
        showErrorHelp();
    });

// tslint:disable-next-line:max-func-body-length cyclomatic-complexity
async function processConfiguration(): Promise<void> {
    if (!args.folder) {
        throw new Error('missing --folder argument');
    }
    const recipeJson: string = await txtfile.read(`${args.folder}/bot.recipe`);
    const recipe: BotRecipe = <BotRecipe>JSON.parse(recipeJson);

    try {
        let command: string = '';
        let output: { stdout: string; stderr: string };

        // get subscription account data
        command = `az account show`;
        if (args.subscriptionId) {
            command += `--subscription ${args.subscriptionId}`;
        }

        logCommand(args, `Fetching subscription account`, command);
        output = await exec(command);
        const azAccount: {id: string; tenantId: string; name: ''} = JSON.parse(output.stdout);
        args.subscriptionId = azAccount.id;
        args.tenantId = azAccount.tenantId;
        if (!args.quiet) {
            console.log(`Creating resources in subscription: ${azAccount.name} ${azAccount.id}`);
        }

        // create group
        const azBase: ICloneArgs = {
            name: '',
            folder: '',
            location: '',
            subscriptionId: '',
            tenantId: '',
            groupName: '',
            secret: '',
            quiet: false,
            verbose: false,
            luisAuthoringKey: '',
            luisSubscriptionKey: '',
            qnaSubscriptionKey: '',
            luisRegion: '',
            args: []
        };
        let azGroup: ICloneArgs = azBase;
        let azBot: IBotService | undefined;
        let azQnaSubscription: ICloneArgs = azBase;
        let azLuisSubscription: ICloneArgs = azBase;

        // make sure we have args for services and provisioned LUIS and QnA cognitive services
        for (const resource of recipe.resources) {
            switch (resource.type) {
                case ServiceTypes.Luis:
                case ServiceTypes.Dispatch:
                    if (!args.luisAuthoringKey) {
                        throw new Error('missing --luisAuthoringKey argument');
                    }
                    if (!azLuisSubscription) {
                        if (!azGroup) {
                            azGroup = await createGroup();
                        }

                        // create luis subscription
                        const luisCogsName: string = `${args.name}-LUIS`;
                        command = `az cognitiveservices account create -g ${azGroup.name}`
                                + ` --kind LUIS -n "${luisCogsName}" --location ${args.location} --sku S0 --yes`;
                        logCommand(args, `Creating LUIS Cognitive Service [${luisCogsName}]`, command);
                        output = await exec(command);
                        azLuisSubscription = JSON.parse(output.stdout);

                        // get keys
                        command = `az cognitiveservices account keys list -g ${azGroup.name} -n "${luisCogsName}"`;
                        logCommand(args, `Fetching LUIS Keys [${luisCogsName}]`, command);
                        output = await exec(command);
                        const luisKeys: { key1: string } = JSON.parse(output.stdout);
                        args.luisSubscriptionKey = luisKeys.key1;
                        args.luisRegion = args.location;
                    }
                    break;

                case ServiceTypes.QnA:
                    if (!azQnaSubscription) {
                        if (!azGroup) {
                            azGroup = await createGroup();
                        }

                        if (!azBot) {
                            azBot = await createBot();
                        }
                        // create qnaMaker service in resource group

                        // we have a group, and app service,

                        // provision search instance
                        const searchName: string = `${args.name.toLowerCase()}-search`;
                        command = `az search service create -g ${azGroup.name} -n "${searchName}" --sku standard`;
                        logCommand(args, `Creating Azure Search Service [${searchName}]`, command);
                        output = await exec(command);

                        // get search keys
                        command = `az search admin-key show -g ${azGroup.name} --service-name "${searchName}"`;
                        logCommand(args, `Fetching Azure Search Service keys [${searchName}]`, command);
                        output = await exec(command);
                        const searchKeys: {primaryKey: string} = JSON.parse(output.stdout);

                        // create qna host service
                        const qnaHostName: string = `${args.name}-qnahost`;
                        command = `az webapp create -g ${azGroup.name} -n ${qnaHostName} --plan ${args.name}`;
                        logCommand(args, `Creating QnA Maker host web service [${qnaHostName}]`, command);
                        output = await exec(command);

                        // configure qna web service settings
                        command = `az webapp config appsettings set -g ${azGroup.name} -n ${qnaHostName} --settings `;
                        command += `"AzureSearchName=${searchName}" `;
                        command += `AzureSearchAdminKey=${searchKeys.primaryKey} `;
                        command += `PrimaryEndpointKey=${qnaHostName}-PrimaryEndpointKey  `;
                        command += `SecondaryEndpointKey=${qnaHostName}-SecondaryEndpointKey `;
                        command += `DefaultAnswer="No good match found in KB." `;
                        command += `QNAMAKER_EXTENSION_VERSION="latest"`;
                        logCommand(args, `Configuring QnA Maker host web service settings [${qnaHostName}]`, command);
                        output = await exec(command);

                        command = `az webapp cors add -g ${azGroup.name} -n ${qnaHostName} -a "*"`;
                        logCommand(args, `Configuring QnA Maker host web service CORS [${qnaHostName}]`, command);
                        output = await exec(command);

                        // create qnamaker account
                        const qnaAccountName: string = `${args.name}-QnAMaker`;
                        command = `az cognitiveservices account create -g ${azGroup.name} --kind QnAMaker -n "${qnaAccountName}" --sku S0 `;
                        command += `--location ${azGroup.location} --yes `;
                        command += `--api-properties qnaRuntimeEndpoint=https://${qnaHostName}.azurewebsites.net`;
                        logCommand(args, `Creating QnA Maker Cognitive Service [${qnaAccountName}]`, command);
                        output = await exec(command);
                        azQnaSubscription = JSON.parse(output.stdout);

                        // get qna subscriptionKey
                        command = `az cognitiveservices account keys list -g ${azGroup.name} -n "${qnaAccountName}"`;
                        logCommand(args, `Fetching QnA Maker Cognitive Service [${qnaAccountName}]`, command);
                        output = await exec(command);
                        const azQnaKeys: {key1: string} = JSON.parse(output.stdout);
                        args.qnaSubscriptionKey = azQnaKeys.key1;
                    }
                    break;

                default:
                    if (!args.location) {
                        throw new Error('missing --location argument'); }
            }
        }
        // create group if not created yet
        if (!azGroup) {
            azGroup = await createGroup();
        }

        // create bot if not created yet
        if (!azBot) {
            azBot = await createBot();
        }

        const azBotEndpoint: IEndpointService = {
            appId: '',
            appPassword: '',
            endpoint: '',
            name: ''
        };
        Object.assign(azBotEndpoint, azBot);

        command = `az bot show -g ${args.name} -n ${args.name}`;
        logCommand(args, `Fetching bot extended information [${args.name}]`, command);
        output = await exec(command);

        // tslint:disable-next-line:no-any
        const azBotExtended: any = JSON.parse(output.stdout);

        // fetch co-created resources so we can get blob and appinsights data
        command = `az resource list -g ${azGroup.name}`;
        logCommand(args, `Fetching co-created resources [${args.name}]`, command);
        output = await exec(command);
        // tslint:disable-next-line:no-any
        const azGroupResources: any = JSON.parse(output.stdout);
        let appInsightInfo: {name: string} = { name: ''};
        let storageInfo: {name: string} = {name: ''};
        for (const groupResource of azGroupResources) {
            if (groupResource.type === 'microsoft.insights/components') {
                appInsightInfo = groupResource;
            } else if (groupResource.type === 'Microsoft.Storage/storageAccounts') {
                storageInfo = groupResource;
            }
        }

        for (const resource of recipe.resources) {
            switch (resource.type) {

                case ServiceTypes.AppInsights:
                    {
                        // this was created via az bot create, hook it up
                        config.services.push(new AppInsightsService({
                            type: ServiceTypes.AppInsights,
                            id: resource.id,
                            tenantId: args.tenantId,
                            subscriptionId: args.subscriptionId,
                            resourceGroup: args.groupName,
                            name: appInsightInfo.name,
                            serviceName: appInsightInfo.name,
                            instrumentationKey: azBotExtended.properties.developerAppInsightKey,
                            applicationId: azBotExtended.properties.developerAppInsightsApplicationId,
                            apiKeys: azBotExtended.properties.developerAppInsightsApiKey
                        }));
                        await config.save();
                    }
                    break;

                case ServiceTypes.BlobStorage:
                    {
                        // this was created via az bot create, get the connection string and then hook it up
                        command = `az storage account show-connection-string -g ${azGroup.name} -n "${storageInfo.name}"`;
                        logCommand(args, `Fetching Azure Blob Storage connection string [${args.name}]`, command);
                        output = await exec(command);
                        const blobConnection: {connectionString: string} = JSON.parse(output.stdout);

                        const blobResource: IBlobResource = <IBlobResource>resource;
                        config.services.push(new BlobStorageService({
                            type: ServiceTypes.BlobStorage,
                            id: resource.id,
                            name: storageInfo.name,
                            serviceName: storageInfo.name,
                            tenantId: args.tenantId,
                            subscriptionId: args.subscriptionId,
                            resourceGroup: args.groupName,
                            connectionString: blobConnection.connectionString,
                            container: blobResource.container
                        }));
                        await config.save();
                    }
                    break;

                case ServiceTypes.Bot:
                    {
                        // created via az bot create, register the result
                        config.services.push(new BotService({
                            type: ServiceTypes.Bot,
                            id: resource.id,
                            name: azBot.name,
                            tenantId: args.tenantId,
                            subscriptionId: args.subscriptionId,
                            resourceGroup: args.groupName,
                            serviceName: azBot.name,
                            appId: azBot.appId
                        }));
                        await config.save();
                    }
                    break;

                case ServiceTypes.CosmosDB:
                    {
                        const cosmosResource: ICosmosDBResource = <ICosmosDBResource>resource;
                        const cosmosName: string = `${args.name.toLowerCase()}`;

                        // az cosmosdb create --n name -g Group1
                        command = `az cosmosdb create -n ${cosmosName} -g ${azGroup.name}`;
                        logCommand(args, `Creating Azure CosmosDB account [${cosmosName}] (long operation)`, command);
                        output = await exec(command);

                        // get keys
                        command = `az cosmosdb list-keys -g ${azGroup.name} -n ${cosmosName}`;
                        logCommand(args, `Fetching Azure CosmosDB account keys [${args.name}]`, command);
                        output = await exec(command);
                        const cosmosDbKeys: {primaryMasterKey: string} = JSON.parse(output.stdout);

                        command = `az cosmosdb database create -g ${azGroup.name} -n ${cosmosName} --key ` +
                                `${cosmosDbKeys.primaryMasterKey} -d ${cosmosResource.database}` +
                                ` --url-connection https://${cosmosName}.documents.azure.com:443/`;
                        logCommand(args, `Creating Azure CosmosDB database [${cosmosResource.database}]`, command);
                        output = await exec(command);

                        command = `az cosmosdb collection create -g ${azGroup.name} -n ${cosmosName} --key ` +
                                `${cosmosDbKeys.primaryMasterKey} -d ${cosmosResource.database} ` +
                                `--url-connection https://${cosmosName}.documents.azure.com:443/ ` +
                                `--collection-name ${cosmosResource.collection}`;
                        logCommand(args, `Creating Azure CosmosDB collection [${cosmosResource.collection}]`, command);
                        output = await exec(command);

                        const connectionString: string = `AccountEndpoint=https://${cosmosName}.documents.azure.com:443/;` +
                                                        `AccountKey=${cosmosDbKeys.primaryMasterKey};`;

                        // register it as a service
                        config.services.push(new CosmosDbService({
                            type: ServiceTypes.CosmosDB,
                            id: cosmosResource.id,
                            name: cosmosName,
                            serviceName: cosmosName,
                            tenantId: args.tenantId,
                            subscriptionId: args.subscriptionId,
                            resourceGroup: args.groupName,
                            endpoint: `https://${cosmosName}.documents.azure.com:443/`,
                            key: cosmosDbKeys.primaryMasterKey,
                            database: cosmosResource.database,
                            collection: cosmosResource.collection
                        }));
                    }
                    await config.save();
                    break;

                case ServiceTypes.Endpoint:
                    {
                        const urlResource: IUrlResource = <IUrlResource>resource;
                        if (urlResource.url && urlResource.url.indexOf('localhost') > 0) {
                            // add localhost record as is, but add appId/password
                            config.services.push(new EndpointService({
                                type: ServiceTypes.Endpoint,
                                id: resource.id,
                                name: resource.name,
                                appId: azBotEndpoint.appId,
                                appPassword: azBotEndpoint.appPassword,
                                endpoint: urlResource.url
                            }));
                        } else {
                            // merge oldUrl and new Url hostname
                            const oldUrl: URL = new url.URL(urlResource.url);
                            const azUrl: URL = new url.URL(azBotEndpoint.endpoint);
                            oldUrl.hostname = azUrl.hostname;

                            config.services.push(new EndpointService({
                                type: ServiceTypes.Endpoint,
                                id: resource.id,
                                name: resource.name,
                                appId: azBotEndpoint.appId,
                                appPassword: azBotEndpoint.appPassword,
                                endpoint: oldUrl.href
                            }));

                            if (oldUrl !== azUrl) {
                                // TODO update bot service record with merged url

                            }
                        }
                        await config.save();
                    }
                    break;

                case ServiceTypes.File:
                    {
                        const fileResource: IFileResource = <IFileResource>resource;
                        config.services.push(new FileService({
                            type: ServiceTypes.File,
                            id: fileResource.id,
                            name: fileResource.name,
                            path: fileResource.path
                        }));
                        await config.save();
                    }
                    break;

                case ServiceTypes.Generic:
                    {
                        const genericResource: IGenericResource = <IGenericResource>resource;
                        config.services.push(new GenericService({
                            type: ServiceTypes.Generic,
                            id: genericResource.id,
                            name: genericResource.name,
                            url: genericResource.url,
                            configuration: genericResource.configuration
                        }));
                        await config.save();
                    }
                    break;

                case ServiceTypes.Dispatch:
                    {
                        const dispatchResource: IDispatchResource = <IDispatchResource>resource;

                        // import application
                        const luisPath: string = `${args.folder}/${resource.id}.luis`;
                        const appName: string = `${args.name}-${resource.name}`;
                        command = `luis import application --appName ${appName} --in "${luisPath}"` +
                                ` --authoringKey ${args.luisAuthoringKey} --msbot`;
                        logCommand(args, `Creating LUIS Dispatch application [${appName}]`, command);
                        output = await exec(command);
                        const luisService: ILuisService = <ILuisService>JSON.parse(output.stdout);

                        const dispatchService: IDispatchService = { serviceIds: dispatchResource.serviceIds, ...luisService};
                        // tslint:disable-next-line:no-any
                        (<any>dispatchService).type = ServiceTypes.Dispatch;
                        dispatchService.id = resource.id; // keep same resource id
                        config.services.push(new DispatchService(dispatchService));
                        await config.save();

                        // train luis service
                        await TrainAndPublishLuisService(luisService);
                    }
                    break;

                case ServiceTypes.Luis:
                    {
                        // import application
                        const luisPath: string = `${args.folder}/${resource.id}.luis`;
                        const luisAppName: string = `${args.name}-${resource.name}`;
                        command = `luis import application --appName "${luisAppName}" ` +
                                `--in ${luisPath} --authoringKey ${args.luisAuthoringKey} --msbot`;
                        logCommand(args, `Creating LUIS application [${luisAppName}]`, command);
                        output = await exec(command);
                        const luisService: ILuisService = <ILuisService>JSON.parse(output.stdout);
                        luisService.id = resource.id; // keep same resource id
                        config.services.push(luisService);
                        await config.save();

                        // train luis service
                        await TrainAndPublishLuisService(luisService);
                    }
                    break;

                case ServiceTypes.QnA:
                    {
                        const qnaPath: string = `${args.folder}/${resource.id}.qna`;
                        const kbName: string = `${args.name}-${resource.name}`;
                        command = `qnamaker create kb --subscriptionKey ${args.qnaSubscriptionKey} ` +
                                `--name "${kbName}" --in ${qnaPath} --wait --msbot -q`;
                        logCommand(args, `Creating QnA Maker KB [${kbName}]`, command);
                        output = await exec(command);
                        const service: IQnAService = <IQnAService>JSON.parse(output.stdout);
                        service.id = resource.id; // keep id
                        service.name = kbName;
                        config.services.push(service);
                        await config.save();
                    }
                    break;

                default:
            }
        }

        // hook up appinsights and blob storage if it hasn't been already
        if (azBot) {
            let hasBot: boolean = false;
            let hasBlob: boolean = false;
            let hasAppInsights: boolean = false;
            for (const service of config.services) {
                switch (service.type) {
                    case ServiceTypes.AppInsights:
                        hasAppInsights = true;
                        break;
                    case ServiceTypes.BlobStorage:
                        hasBlob = true;
                        break;
                    case ServiceTypes.Bot:
                        hasBot = true;
                    default:
                }
            }
            if (!hasBot && azBot) {
                // created via az bot create, register the result
                config.connectService(new BotService({
                    name: azBot.name,
                    tenantId: args.tenantId,
                    subscriptionId: args.subscriptionId,
                    resourceGroup: args.groupName,
                    serviceName: azBot.name,
                    appId: azBot.appId
                }));

                // add endpoint
                config.connectService(new EndpointService({
                    type: ServiceTypes.Endpoint,
                    name: azBot.name,
                    appId: azBotEndpoint.appId,
                    appPassword: azBotEndpoint.appPassword,
                    endpoint: azBotEndpoint.endpoint
                }));

                await config.save();
            }

            if (!hasAppInsights && azBotExtended) {
                // this was created via az bot create, hook it up
                config.connectService(new AppInsightsService({
                    tenantId: args.tenantId,
                    subscriptionId: args.subscriptionId,
                    resourceGroup: args.groupName,
                    name: appInsightInfo.name,
                    serviceName: appInsightInfo.name,
                    instrumentationKey: azBotExtended.properties.developerAppInsightKey,
                    applicationId: azBotExtended.properties.developerAppInsightsApplicationId,
                    apiKeys: azBotExtended.properties.developerAppInsightsApiKey
                }));
                await config.save();
            }

            if (!hasBlob && storageInfo) {
                // this was created via az bot create, get the connection string and then hook it up
                command = `az storage account show-connection-string -g ${azGroup.name} -n "${storageInfo.name}"`;
                logCommand(args, `Fetching storage connection string [${storageInfo.name}]`, command);
                output = await exec(command);
                const blobConnection: {connectionString: string} = JSON.parse(output.stdout);

                config.connectService(new BlobStorageService({
                    name: storageInfo.name,
                    serviceName: storageInfo.name,
                    tenantId: args.tenantId,
                    subscriptionId: args.subscriptionId,
                    resourceGroup: args.groupName,
                    connectionString: blobConnection.connectionString,
                    container: null
                }));
                await config.save();
            }
        }
        console.log(`${config.getPath()} created.`);
        console.log(`Done cloning.`);
    } catch (error) {
        const lines: string[] = error.message.split('\n');
        let message: string = '';
        for (const line of lines) {
            // trim to copywrite symbol, help from inner process command line args is inappropriate
            if (line.indexOf('©') > 0) {
                break; }
            message += line;
        }
        throw new Error(message);
    }
}

async function TrainAndPublishLuisService(luisService: ILuisService): Promise<void> {
    let command: string = `luis train version --appId ${luisService.appId} ` +
                `--authoringKey ${luisService.authoringKey} --versionId "${luisService.version}" --wait `;
    logCommand(args, `Training LUIS application [${luisService.name}]`, command);
    await spawnAsync(command);

    // publish application
    command = `luis publish version --appId ${luisService.appId} ` +
            `--authoringKey ${luisService.authoringKey} --versionId "${luisService.version}" --region ${luisService.region} `;
    logCommand(args, `Publishing LUIS application [${luisService.name}]`, command);
    await exec(command);

    // mark application as public (TEMPORARY, THIS SHOULD BE REMOVED ONCE LUIS PROVIDES KEY ASSIGN API)
    command = `luis update settings --appId ${luisService.appId} --authoringKey ${luisService.authoringKey} --public true`;
    logCommand(args, `Updating LUIS settings [${luisService.name}]`, command);
    await exec(command);
}

async function createBot(): Promise<IBotService> {
    const command: string = `az bot create -g ${args.name} --name ${args.name} --kind webapp --location ${args.location}`;
    logCommand(args, `Creating Azure Bot Service [${args.name}]`, command);

    const stdout: string = await spawnAsync(command, undefined, (stderr: string) => {
        if (stderr.indexOf('https://microsoft.com/devicelogin') > 0) {
            console.warn(stderr.replace('WARNING: ', ''));
            opn('https://microsoft.com/devicelogin');
        } else if (stderr.indexOf('Provisioning') > 0) {
            // we need to show warning to user so we can get instructions on logging in
            console.warn(`${stderr.replace('WARNING: ', '')} (this will take several minutes)`);
        }
    });

    return <IBotService>JSON.parse(stdout);
}

async function createGroup(): Promise<ICloneArgs> {
    if (!args.location) {
        throw new Error('missing --location argument');
    }

    const command: string = `az group create -g ${args.name} -l ${args.location}`;
    logCommand(args, `Creating Azure group [${args.name}]`, command);
    const p: { stdout: string; stderr: string } = await exec(command);
    const azGroup: ICloneArgs = JSON.parse(p.stdout);
    args.groupName = azGroup.name;

    return azGroup;
}

function showErrorHelp(): void {
    program.outputHelp((str: string) => {
        console.error(str);

        return '';
    });
    console.log(chalk.default.bold(`NOTE: You did not complete clone process.`));
    if (typeof (args.name) === 'string') {
        console.log(`To delete the group and resources run:`);
        console.log(chalk.default.italic(`az group delete -g ${args.name} --no-wait`));
    }
    process.exit(1);
}

function logCommand(logArgs: ICloneArgs, message: string, command: string): void {
    if (!logArgs.quiet) {
        console.log(chalk.default.bold(message));
        if (logArgs.verbose) {
            console.log(chalk.default.italic(command));
        }
    }
}
