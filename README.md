# Bot Builder tools (PREVIEW) [![Build Status](https://travis-ci.org/Microsoft/botbuilder-tools.svg?branch=master)](https://travis-ci.org/Microsoft/botbuilder-tools) [![Coverage Status](https://coveralls.io/repos/github/Microsoft/botbuilder-tools/badge.svg?branch=master)](https://coveralls.io/github/Microsoft/botbuilder-tools?branch=master) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
Bot Builder tools are designed to cover end-to-end bot development workflow and include the following tools - 

|   | Tool | Description |
|---|------|--------------|
| [![npm version](https://badge.fury.io/js/chatdown.svg)](https://badge.fury.io/js/chatdown) | [Chatdown](packages/Chatdown) | Prototype mock conversations in markdown and convert the markdown to transcripts you can load and view in the new V4 Bot Framework Emulator |
| [![npm version](https://badge.fury.io/js/msbot.svg)](https://badge.fury.io/js/msbot) |[MSBot](packages/MSBot)| Create and manage connected services in your bot configuration file|
| [![npm version](https://badge.fury.io/js/ludown.svg)](https://badge.fury.io/js/ludown) |[LUDown](packages/Ludown)| Build LUIS language understanding models using markdown files|
| [![npm version](https://badge.fury.io/js/luis-apis.svg)](https://badge.fury.io/js/luis-apis) |[LUIS](packages/LUIS)| Create and manage your [LUIS.ai](http://luis.ai) applications |
| [![npm version](https://badge.fury.io/js/qnamaker.svg)](https://badge.fury.io/js/qnamaker) |[QnAMaker](packages/QnAMaker) | Create and manage [QnAMaker.ai](http://qnamaker.ai) Knowledge Bases. |
| [![npm version](https://badge.fury.io/js/botdispatch.svg)](https://badge.fury.io/js/botdispatch) | [Dispatch](packages/Dispatch) | Build language models allowing you to dispatch between disparate components (such as QnA, LUIS and custom code)|
| [![npm version](https://badge.fury.io/js/luisgen.svg)](https://badge.fury.io/js/luisgen)| [LUISGen](packages/LUISGen) | Autogenerate backing C#/Typescript classesfor your LUIS intents and entities.|

To install all CLI tools:

```
npm install -g chatdown msbot ludown luis-apis qnamaker botdispatch luisgen
```

- Please see [here](https://aka.ms/BotBuilderOverview) for an overview of the end-to-end bot development workflow. 
- Please see [here](https://aka.ms/BotBuilderLocalDev) for an example end to end bot development workflow using Bot Builder tools.

Bot Builder tools are designed to work with
- [Bot Builder V3 SDK](https://github.com/microsoft/botbuilder)
- Bot Builder V4 SDK PREVIEW - [dotnet](https://github.com/microsoft/botbuilder-dotnet), [JS](https://github.com/microsoft/botbuilder-js), [Java](https://github.com/microsoft/botbuilder-java) and [Python](https://github.com/microsoft/botbuilder-python)

Before writing code, review the [bot design guidelines](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-design-principles) for best practices and identify the needs for your bot: will a basic bot be enough or whether it should have more sophisticated capabilities, such as speech, language understanding, QnA, or the ability to extract knowledge from different sources and provide intelligent answers. This is also the phase where you might want to create mockup of conversations between the user and the bot for the specific scenarios your bot will support. [Chatdown](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/Chatdown) is the tool built for this purpose. You can author .chat files that mockup the conversations and then use chatdown CLI to convert them into rich transcripts. 

As you build your bot, you may also need to integrate AI services like [LUIS.ai](http://luis.ai) for language understanding, [QnAMaker.ai](http://qnamaker.ai) for your bot to respond to simple questions in a Q&A format, and more. You can bootstrap language understanding for your bot using [LUDown](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/Ludown). 

The tools are designed to work together. You can then use [LUIS](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/LUIS) CLI and/or the [QnAMaker](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/QnAMaker) CLI tools to create your LUIS.ai models and QnAMaker knowledge base. 

As your bot grows in sophistication, [Dispatch](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/Dispatch) CLI can help create and evaluate LUIS models used to dispatch intent across multiple bot modules such as LUIS models, QnA knowledge bases and others (added to dispatch as a file type).

Throughout the Build phase, you can use [MSBot](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/MSBot) CLI to create and keep your bot configuration file updated with all relevant service references.

To test and refine your bot, you can use the new [V4 Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases). The Bot Framework Emulator is a cross-platform [electron](https://electronjs.org/) application that enables you to test and debug your bots on  local machine or in the cloud. The new emulator includes features like faster load times, an improved dynamic layout model, support for multiple bot configurations, simple bot components management, and the ability to inspect responses from connected services such as LUIS and QnA. The Bot Framework Emulator also deep links to different parts used by the bot. The Bot Framework Emulator new functionality enables you to debug bots based on transcript logs and to view previous chat in presentation mode. The Bot Framework Emulator is available as open source on [Github](https://github.com/Microsoft/BotFramework-Emulator). 

## Building the tools

In order to build the SDK, ensure that you have [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/) installed.

Run the following commands to build all tools.

```
npm install
npm run build
```

Run the following command to verify your instalation.

```
npm run test
```

This repository uses [lerna](https://github.com/lerna/lerna) to manage the packages included. This allows you to execute scripts for all packages or only for some packages. For instance, `lerna run test` will run all tests in each package, but `lerna run test --scope chatdown` will run the tests of chatdown.

To use lerna, install it as a global package with `npm install lerna --global`.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Reporting Security Issues
Security issues and bugs should be reported privately, via email, to the Microsoft Security Response Center (MSRC) at [secure@microsoft.com](mailto:secure@microsoft.com). You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message. Further information, including the [MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155) key, can be found in the [Security TechCenter](https://technet.microsoft.com/en-us/security/default).

## License

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the [MIT](LICENSE) License.
