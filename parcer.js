const fs = require('fs');
const path = require('path');

const params = {
    sourcePath: '../finer.es/',
    targetPath: './res',
    fileName: 'phrases',
    needFileList: true,
    needLocalObject: true,
    excludeDir: [
        '.nuxt',
        'node_modules',
        '.git',
        '.idea',
        'tmp'
    ],
    includeExt: [
        '.vue',
        '.html'
    ]
};

let totalCounter = 0;
let list = [];
const fileList = {};
const filePath = path.join(__dirname, params.targetPath, params.fileName + '.json');

function getObj (list) {
    const loc = {};
    loc.en = {};
    list.forEach(it => loc.en[it] = it);
    return loc;
}

function parcer (rootPath) {

    const filesList = fs.readdirSync(rootPath);
    for (let fileName of filesList) {

        const stat = fs.statSync(rootPath + fileName);
        const filePath = rootPath + fileName + '/';

        if (!stat.isFile()) {
            if (params.excludeDir.includes(fileName)) {
                continue;
            }
            parcer(filePath);
        } else {

            const ext = path.extname(fileName);
            if (params.includeExt.includes(ext)) {
                const data = fs.readFileSync(filePath);
                const htmlStr = data.toString();
                fileList[filePath] = [];

                const tmpFiltersReg = /{{\s*['"](?<mystring>.*)['"]\s*\|\s*translate/gm;

                let res = htmlStr.match(/\$t\(\D+?\)/gm);
                const resFilters = htmlStr.match(tmpFiltersReg);

                if (res) {
                    if (resFilters) {
                        res = res.concat(resFilters);
                    }

                    res.forEach(item => {
                        totalCounter++;
                        let phrase = item.match(/"([^"\\]|\\.|\\\n)*"|'([^'\\]|\\.|\\\n)*'/);

                        if (phrase) {
                            phrase = phrase[0].slice(1);
                            phrase = phrase.slice(0, phrase.length - 1);

                            if (list.includes(phrase)) {
                                return;
                            }
                            fileList[filePath].push(phrase);
                            list.push(phrase);
                        }
                    });
                }
            }
        }
    }
}

function writeFile (targetPath, fileName, data) {
    fs.mkdir(path.join(__dirname, targetPath), {recursive: true}, (err) => {
        if (err) throw err;
        fs.writeFileSync(path.join(__dirname, targetPath, fileName), data);
    });
}

fs.stat(filePath, (err, stats) => {
    if (err) {
        console.log(err);
    } else {
        if (stats.isFile()) {
            const targetFile = fs.readFileSync(filePath);
            if (targetFile) {
                const data = targetFile.toString();
                try {
                    list = list.concat(JSON.parse(data));

                    fs.unlink(filePath, (err) => {
                        if (err) console.log(err);
                    });
                } catch (e) {
                    console.log(e);
                }
            }
        }

        parcer(params.sourcePath);
        if (params.needFileList) {
            writeFile(params.targetPath, 'files.json', JSON.stringify(fileList));
        }
        if (params.needLocalObject) {
            writeFile(params.targetPath, `${params.fileName}LocalObject.json`, JSON.stringify(getObj(list)));
        }
        writeFile(params.targetPath, `${params.fileName}.json`, JSON.stringify(list));
        console.log('Total phrases: ', totalCounter, '---- Unique phrases: ', list.length);
    }
});
