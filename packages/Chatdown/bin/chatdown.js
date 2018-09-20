#!/usr/bin/env node
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const pkg = require('../package.json');
const semver = require('semver');
let requiredVersion = pkg.engines.node;
if (!semver.satisfies(process.version, requiredVersion)) {
    console.log(`Required node version ${requiredVersion} not satisfied with current version ${process.version}.`);
    process.exit(1);
}

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const minimist = require('minimist');
const help = require('../lib/help');
const chatdown = require('../lib/index');
const txtfile = require('read-text-file');
const glob = require('glob');

/**
 * Retrieves the content to be parsed from a file if
 * the [chat] argument was specified or from the stdin
 * stream otherwise. Currently, interactive mode is
 * not supported and will timeout if no data is received
 * from stdin within 1000ms.
 *
 * @param args An object containing the argument k/v pairs
 * @returns {Promise} a Promise that resolves to the content to be parsed
 */
function getInput(args) {
    if (args._.length > 0) {
        args.in = args._[0];
        return txtfile.readSync(path.resolve(args.in));
    }
    else {
        return new Promise((resolve, reject) => {
            const { stdin } = process;
            let timeout = setTimeout(reject, 1000);
            let input = '';

            stdin.setEncoding('utf8');
            stdin.on('data', chunk => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                input += chunk;
            });

            stdin.on('end', () => {
                resolve(input);
            });

            stdin.on('error', error => reject(error));
        });
    }
}

/**
 * Writes the output either to a file if --out is
 * specified or to stdout otherwise.
 *
 * @param {Array<Activity>} activities The array of activities resulting from the dialog read
 * @param args An object containing the argument k/v pairs
 * @returns {Promise<string>|boolean} The path of the file to write or true if written to stdout
 */
async function writeOut(activities, args) {
    const { out } = args; //Is this used? Doesn't seem to be...
    process.stdout.write(JSON.stringify(activities, null, 2));
    return true;
}

/**
 * Processes multiple files, and writes them to the output directory.
 *
 * @param {string} inputDir String representing a glob that specifies the input directory
 * @param {string} outputDir String representing the output directory for the processed files
 * @returns {Promise<string>|boolean} The length of the files array that was processed
 */
async function processFiles(inputDir, outputDir) {
    return new Promise(async (resolve, reject) => {
        let files = glob.sync(inputDir, { "ignore": ["**/node_modules/**"] });
        for(let i = 0; i < files.length; i++) {
            try {
                let fileName = files[i];
                if(files[i].lastIndexOf("/") != -1) {
                    fileName = files[i].substr(files[i].lastIndexOf("/"))
                }
                fileName = fileName.split(".")[0];
                let activities = await chatdown(txtfile.readSync(files[i]));
                let writeFile = `${outputDir}/${fileName}.transcript`;
                await fs.ensureFile(writeFile);
                await fs.writeJson(writeFile, activities, { spaces: 2 });
            }
            catch(e) {
                reject(e);
            }
        }
        resolve(files.length);
    });
}
/**
 * Runs the program
 *
 * @returns {Promise<void>}
 */
async function runProgram() {
    const args = minimist(process.argv.slice(2));

    if (args.version || args.v) {
        return process.stdout.write(require(path.join(__dirname, '../package.json')).version);
    }

    if (args.h || args.help) {
        help(process.stdout);
        return 0;
    }

    if(args.f || args.folder) {
        let inputDir = args.f.trim();
        let outputDir = (args.o || args.out_folder) ?  args.o.trim() : "./";
        if (outputDir.substr(0, 2) === "./") {
            outputDir = path.resolve(process.cwd(), outputDir.substr(2))
        }
            const len = await processFiles(inputDir, outputDir);
            process.stdout.write(chalk`{green Successfully wrote ${len} files}\n`);
            return len;
    }
    else {
        const fileContents = await getInput(args);
        if (fileContents) {
            const activities = await chatdown(fileContents, args);
            const writeConfirmation = await writeOut(activities, args);

            if (typeof writeConfirmation === 'string') {
                process.stdout.write(chalk`{green Successfully wrote file:} {blue ${writeConfirmation}}\n`);
            }
            return 0;
        }
        else {
            help();
            return -1;
        }
    }
}

/**
 * Utility function that exits the process with an
 * optional error. If an Error is received, the error
 * message is written to stdout, otherwise, the help
 * content is displayed.
 *
 * @param {*} error Either an instance of Error or null
 */
function exitWithError(error) {
    if (error instanceof Error) {
        process.stderr.write(chalk.red(error));
    } else {
        help();
    }
    process.exit(1);
}

runProgram()
    .then(() => process.exit(0))
    .catch(exitWithError);