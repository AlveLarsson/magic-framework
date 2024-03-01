import * as build from "./build.js";
import * as log from "./log.js";
import fs from "fs";
import path from "path";
import process from "process";
import { version as ver } from "./version.js";
import * as watch from "./watch.js";

// TODO: find a neater way instead 2 arrays for itterating over
export var config = { dist: "public", src: "src", assets: "assets", systems: "systems" };
export var configData = [config.dist, config.src, config.assets, config.systems];

export const commands = [
    { "name": "dist", "description": "The directory to output the build files to", "type": "config", "default": "./public", "function": null },
    { "name": "help", "description": "Show this help message", "type": "command", "default": false, "function": help },
    { "name": "new", "description": "Create a new project at the path", "type": "command", "default": false, "function": project },
    { "name": "dev", "description": "Start development mode", "type": "command", "default": false, "function": watch.watch },
    { "name": "build", "description": "Build the project", "type": "command", "default": false, "function": build.build },
    { "name": "version", "description": "Show the version number and exit", "type": "command", "default": false, "function": version },
    { "name": "setup", "description": "Setup a config file in the current directory", "type": "command", "default": false, "function": setup },
];

const newProject = [
    { "name": "magic.config", "type": "file", "content": dumpConfig },
    { "name": config.dist, "type": "dir" },
    { "name": config.assets, "type": "dir" },
    { "name": config.systems, "type": "dir" },
];

export async function parse(args) {
    if (args.length === 0) {
        help();
        return;
    }

    let command = commands.find(c => c.name === args[0]);
    if (command) {
        var options = args.slice(1);

        await command.function(options)

    } else {
        log.error("Command not found: " + args[0]);
        help();
    }
}

export function help() {
    log.print("\nUsage: magic [command] [options]");
    log.print("Magic commands:");
    var i = 0;
    for (let command of commands) {
        console.log(log.colors[i % log.colors.length] + ` ${command.name}  --` + log.reset + `  ${command.description}`);
        i += 1;
    }
}

export function dumpConfig() {
    var content = "";

    const len = Object.keys(config).length;
    var i = 0;
    for (const [key, value] of Object.entries(config)) {
        content += key + " " + value + (i < len - 1 ? "\n" : "");
        i += 1;
    }

    return content;
}

export function setup() {
    const config = dumpConfig();

    fs.writeFileSync("magic.config", config);

    log.success("Config file created at " + process.cwd());
    log.print("\nwith default options:", log.yellow);
    console.log(config);
}

export function project(path) {
    if (path.length === 0) {
        log.error("No path provided! usage: magic new <path>");
        return;
    }

    if (fs.existsSync(path[0])) {
        if (fs.readdirSync(path[0]).length > 0) {
            log.error("The directory is not empty");
        } else {
            log.error("The directory already exists");
        }

        process.exit(0);
    }

    log.print("Creating a new project at " + path[0], log.green);

    fs.mkdirSync(path[0], { recursive: true });

    for (let item of newProject) {

        if (item.type === "file") {
            fs.writeFileSync(path + "/" + item.name, item.content());
        }

        if (item.type === "dir") {
            fs.mkdirSync(path +
                "/" + item.name, { recursive: true });
        }

    }
}

var userInput = false;
async function promptNewProject() {
    log.warn("No magic.config file found in this directory...");
    console.log(log.cyan);
    console.log("✨   Would you like to create a new project here? (y/n) \n" + log.magenta + "     > " + process.cwd() + log.reset);

    process.stdin.on('data', function (data) {
        data = data.toString().trim();

        if (data === "y" || data === "yes" || data === "Y" || data === "Yes" || data === "tuta och kör") {
            process.stdin.end();
            project(process.cwd());
        }

        userInput = true;
    });

    while (!userInput) {
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// Loads the config at the root of the project
export async function load() {

    const filePath = path.join(process.cwd(), "magic.config");

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return; // Assume default values
    }

    let data;
    try {
        data = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        log.error("Error reading the file: " + err);
        return;
    }

    const lines = data.split(/\r?\n/); // Handles both \n and \r\n

    for (let line of lines) {
        let parts = line.split(" ");
        let key = parts[0].trim();

        let value = parts.slice(1).join(" ").trim();

        config[key] = value;
    }
}

function todo() {
    log.print("TODO - not implemented yet ", log.red);
}

export function version() {
    log.print(ver);
}