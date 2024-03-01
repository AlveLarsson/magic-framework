import * as settings from "./settings.js";
import * as log from "./log.js";
import * as fs from "fs";
import * as path from "path";
import process from "process";

const loader = `
export async function loadAll() {
    const response = await fetch('/assets.bin');
    const arrayBuffer = await response.arrayBuffer();
    var URL = window.URL || window.webkitURL;

    for (let assetName in asset) {
        const blob = new Blob([new Uint8Array(arrayBuffer, asset[assetName].offset, asset[assetName].size)], { type: asset[assetName].type });
        asset[assetName].blob = URL.createObjectURL(blob);
    }
}`;

const header = '\n// AUTO GENERATED BY MAGIC (npm run magic build) --- DO NOT EDIT THIS FILE.\n\nexport const asset = {\n';

const assetTypes = [
    'mesh',
    'textures',
    'sound',
];

const assetEmojiType = ["🧩", "🎨", "🔊"];

export async function build() {
    await assetBundle();
}

export async function assetBundle() {
    log.print("\n🛠  Building asset bundle...");
    console.time("asset bundle");

    let content = header;
    let blobContents = [];
    let offset = 0;
    let assetCount = [];

    for (let assetType of assetTypes) {
        var assetsCount = 0;
        const dirPath = path.join(process.cwd(), settings.config.assets, assetType);
        log.print(`\n📦   Building  |  ` + log.cyan + dirPath);

        try {
            // Using readdirSync here
            const files = fs.readdirSync(dirPath);
            for (let file of files) {
                const filePath = path.join(dirPath, file);
                const fileExtension = path.extname(file).slice(1);
                const assetBuffer = fs.readFileSync(filePath);
                const type = getType(fileExtension);
                console.log(fileExtension + "  " + filePath);

                content += `    "${path.basename(file, path.extname(file))}": { offset: ${offset}, size: ${assetBuffer.length}, type: "${type}", blob: "" },\n`;
                blobContents.push(assetBuffer);

                offset += assetBuffer.length;
                assetsCount += 1;
            }
        } catch (error) {
            log.error(`processing ${dirPath}: \n` + error);
            // Handle error or continue to next directory
        }

        assetCount.push(assetsCount);
    }

    console.log("");

    const finalBlob = Buffer.concat(blobContents);
    const assetPath = path.join(settings.config.src, 'assets.js');
    fs.writeFileSync(assetPath, content + "};\n" + loader);
    log.print("📦  ⟹   Exported offsets  ⟹   " + assetPath, log.green);

    const binaryPath = path.join(settings.config.dist, 'assets.bin');

    // round to 2 decimal places
    const filesize_mb = finalBlob.length / 1024 / 1024;
    const filesize_rounded = Math.round(filesize_mb * 100) / 100;

    log.print("📦  ⟹   Exported binary   ⟹   " + binaryPath + "  |  " + filesize_rounded + " mb  |  " + finalBlob.length + " kb", log.green);
    fs.writeFileSync(binaryPath, finalBlob);


    let totalAssets = 0;
    for (let i = 0; i < assetCount.length; i++) {
        totalAssets += assetCount[i];
    }

    let assetReport = "";
    for (let i = 0; i < assetCount.length; i++) {
        assetReport += "\n" + assetEmojiType[i] + "  " + assetCount[i] + "  " + assetTypes[i];
    }

    log.print("\nTotal assets: " + totalAssets + "\n" + assetReport + "\n", log.reset);

    console.timeEnd("asset bundle");
}

export function getType(fileExtension) {
    switch (fileExtension) {
        case "obj":
            return "model/obj";
        case "jpg":
            return "image/jpeg";
        case "webp":
            return "image/webp";
        case "png":
            return "image/png";
        case "wav":
            return "audio/wav";
    }
}