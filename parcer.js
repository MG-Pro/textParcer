const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');


const list = [];
const fileList = {};

const excludeDir = [
    '.nuxt',
    'node_modules',
    '.git',
    '.idea',
    'tmp'
];

const includeExt = [
    '.vue',
    '.html'
];

const excludeTags = [
    'link',
    'script',
    'style'

];

function scaner (y) {
    let y1 = fs.readdirSync(y);
    for (let x of y1) {

        let stat = fs.statSync(y + x);
        let filePath = y + x + '/';

        if (!stat.isFile()) {
            if (excludeDir.includes(x)) {
                continue;
            }
            scaner(filePath);
        } else {
            const ext = path.extname(x);
            if (includeExt.includes(ext)) {
                const data = fs.readFileSync(filePath);
                const htmlStr = data.toString();
                const $ = cheerio.load(htmlStr, {
                    normalizeWhitespace: true
                });
                fileList[filePath] = [];
                // console.log('\n', filePath, '\n');

                const tpl = $('template');

                function domEach (html) {
                    for (let i = 0; i < html.length; i++) {
                        const el = html[i];
                        if (el.type === 'text') {
                            const text = $(el).text().replace(/\s+/g, ' ').trim();

                            if (!text.length) {
                                continue;
                            }

                            const res = text.match(/^({{\s*\$t\().+(\)\s*}})$/i);

                            if (!res) {
                                continue;
                            }

                            const phrase = res[0].match(/[^({{\s*\$t\()'"`].+[^(\)\s*'`"}})$]/);

                            if (phrase === null || list.includes(phrase[0])) {
                                continue;
                            }
                            console.log(phrase[0]);
                            fileList[filePath].push(phrase);
                            list.push(phrase);

                        } else if (el.children && el.children.length) {
                            domEach(el.children);
                        }
                    }
                }

                domEach(tpl);

            }

        }
    }
}

scaner('../swapix-mobile/');
fs.writeFileSync('./files.json', JSON.stringify(fileList));
fs.writeFileSync('./phrases.json', JSON.stringify(list));
console.log(list.length);
