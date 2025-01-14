import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { exit } from 'process';
import readline from 'readline';
import { join } from 'path';
// import { promises as fs } from 'fs';

const rl = readline.createInterface(process.stdin, process.stdout);

// read the file and return as json
export async function readJsonFile(filename) {
    const filePath = path.join(process.cwd(), filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
}

export async function readFile(filename) {
    const filePath = path.join(process.cwd(), filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return fileContents;
}

// create a function to write to file
export async function writeJsonFile(filename, content) {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

export async function writeFile(filename, content) {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, content);
}

// run a command
export async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

export const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

export const getArgs = () => {
    const args = process.argv.slice(2);
    return args;
}

export const redLog = (msg, noDash = false) => {
    if (noDash) {
        console.log('\x1b[31m%s\x1b[0m', msg);
    } else {
        console.log('\x1b[31m%s\x1b[0m', `- ${msg}`);
    }
}

export const greenLog = (msg, noDash = false) => {
    if (noDash) {
        console.log('\x1b[32m%s\x1b[0m', msg);
    } else {
        console.log('\x1b[32m%s\x1b[0m', `- ${msg}`);
    }
}

export const question = (str, {
    yes,
    no,
}) => {
    return new Promise((resolve) => {
        return rl.question(`- ${str} [yes]/no:`, async (answer) => {
            if (answer === "no" || answer === "n") {
                no.call(answer);
            }

            if (answer === 'yes' || answer === 'y') {
                yes.call(answer);
            }

            // if nethers of the above, assume yes
            if (answer !== 'yes' && answer !== 'y' && answer !== 'no' && answer !== 'n') {
                redLog('Invalid answer, exiting...');
            }

            resolve();
        });
    });
}

export const getFiles = (path) => new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
        resolve(files)
    });
});

// wait for 1 second
export const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

// recursively list all directories in a directory and return paths relative to root
export const listDirsRelative = async (dir, recursive = true) => {
    const root = join(dir, '..', '..');
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    const dirs = [];
    for (const file of files) {
        if (file.isDirectory()) {
            const path = join(dir, file.name);
            dirs.push(path);

            if (recursive) {
                dirs.push(...(await listDirsRelative(path)));
            }

        }
    }
    return dirs;
}

export const findImportsFromDir = async (dir) => {

    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    const packages = [];

    await asyncForEach(files, async (file) => {

        if (!file.isDirectory()) {
            const filePath = join(dir, file.name);
            // greenLog(`    - Scanning => ${filePath}`, true);

            const contents = await fs.promises.readFile(filePath, 'utf-8');

            // use regex to find all from 'package-name'
            const regex = /from\s+['"]([^'"]+)['"]/g;
            let match;
            while ((match = regex.exec(contents)) !== null) {
                const pkg = match[1];
                packages.push(pkg);
            }
        }
    });

    return packages;
}

export const createDirs = (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}

export const ex = async (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);

            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);

            }
            if (stdout) {
                console.log(`stdout: ${stdout}`);
            }
            resolve();
        });
    });
}

/**
 * Asynchronously runs the specified command and returns the output.
 *
 * @param {string} command The command to run.
 *
 * @return {Promise<string>} A promise that resolves with the output of the command.
 *
 * @throws {Error} If the command fails to run.
 */
export async function childRunCommand(command) {
    return new Promise((resolve, reject) => {
        const child = exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
        child.stdout.on('data', (data) => {
            console.log(data.toString().replace(/\n$/, ''));
        });

        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            // exit();
        });

    });
}

export const spawnCommand = (command, args, options = {}) => {

    // Use the spawn() function to run the command in a child process
    const child = spawn(command, args, options);

    // Handle child process output
    child.stdout.on("data", data => {
        console.log(`child stdout:\n${data}`);
    });

    child.stderr.on("data", data => {
        console.error(`child stderr:\n${data}`);
    });

    child.on("exit", code => {
        console.log(`child process exited with code ${code}`);
    });
}

export const isLineCommented = ({ file, line }) => {
    // find the line that contains import * as LitJsSdk from "lit-js-sdk/build/index.node.js";
    const lines = file.split(line);

    // check the last 5 characters of the last line
    const last2Chars = lines[0].slice(-5);

    // check if it contains //, if so it's commented out
    const isCommentedOut = last2Chars.includes('//');

    return isCommentedOut;
}

export const spawnListener = (commands, callback, prefix = '', color = 31) => {

    let _commands = commands.split(" ");
    // let eventName = _commands.join('-');

    // make commands to pass to spawn
    const command = _commands[0];
    const args = _commands.slice(1);

    // Use the spawn() function to run the command in a child process
    let bob = spawn(command, args, {
        env: {
            ...process.env,
            FORCE_COLOR: true,
        }
    });

    bob.on('exit', (exitCode) => {
        if (parseInt(exitCode) !== 0) {
            // handle non-exit code
            redLog(`child process exited with code ${exitCode} when running ${command}`);

            if (callback?.onExit) {
                callback?.onExit(exitCode);
            }
            exit();
        }
        // eventsEmitter.emit(eventName);

        if (callback?.onDone) {
            callback?.onDone(exitCode);
        }
    })

    // Handle child process output
    // bob.stdout.pipe(process.stdout);
    // randomize the color

    if (!color) {
        color = Math.floor(Math.random() * 6) + 31;
    }

    bob.stdout.on('data', (data) => {
        console.log(`\x1b[${color}m%s\x1b[0m: %s`, prefix, data.toString().replace(/\n$/, ''));
    })

    // foward the key to the child process
    process.stdin.on('data', (key) => {
        bob.stdin.write(key);
    })

    return bob;
}