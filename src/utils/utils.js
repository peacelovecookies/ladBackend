import _ from 'lodash';
import jsdom from "jsdom";
import axios from 'axios';
import PDFDocument from 'pdfkit-table';
import * as url from 'url';
import path from 'path';
import { Readability } from '@mozilla/readability';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const { JSDOM } = jsdom;

// const tagsWithText = ["li", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6"]; // add or remove tags if it's needed
const tagsWithText = ["li", "div", "p"]; // add or remove tags if it's needed

const addWords = (wordsCount, innerText) => innerText
    .split(' ')
    .forEach((word) => {
        if (word.length > 3) {
            wordsCount[word] = _.get(wordsCount, word, 0) + 1;
        }
    })

const collectWords = (data) => {
    const { window: { document } } = new JSDOM(data);
    const wordsCount = {};
    const parser = new Readability(document);
    const { content } = parser.parse();
    const { window: { document: contentDom } } = new JSDOM(content);
    const usedTextContent = [];
    contentDom
        .querySelectorAll('*') // this method may be not super accurate, since textContent takes non-human-readable content... need to refactor this sh*t in the future
        .forEach((node) => {
            const { textContent } = node;
            const children = [...node.children];
            for (let i = 0; i < children.length; i += 1) {
                const childNode = children[i];
                if (childNode.tagName.toLowerCase() === 'div') continue;
            }
            // if (!usedTextContent.includes(textContent)) {
                addWords(wordsCount, textContent);
                usedTextContent.push(textContent)
            // }
        });
        // console.log('test: ', usedTextContent);
    return wordsCount;
}

const getTop = (count, obj) => Object
                                .entries(obj)
                                .sort(([, val1], [, val2]) => val2 - val1)
                                .slice(0, count)
                                .map(([key]) => key);

export const getMostFrequentWords = (wordsCount, urls) => urls.map(async (url) => {
    try {
        const { data } = await axios.get(url, { timeout: 3000 });
        const words = collectWords(data);
        const topList = getTop(wordsCount, words);
        return { url, topList };
    } catch(e) {
        const err = new Error()
        err.name = e.name;
        err.url = e.config.url;
        err.message = `Huston, we've got a problem with fetching data: '${e.message}'`;
        err.code = e.code;
        throw err;
    }
});

export const generatePdf = (fetchedDataObj) => {
    const fulfilled = fetchedDataObj.filter((dataObj) => dataObj.status === 'fulfilled')
    const pdf = new PDFDocument({ margin: 30, size: 'A4' });
    // in this case we don't add result of rejected requests... keep it in mind
    fulfilled.forEach((dataObj) => {
        const { url: link } = dataObj.value;
        const { topList } = dataObj?.value;
        const fontPath = path.join(__dirname, '..', 'fonts/times_new_roman.ttf');
        const table = { 
            title: '',
            headers: ['', '', ''],
            datas: [],
            rows: [topList],
        };
        const tableOptions = {
            prepareRow: () => pdf.font(fontPath),
            prepareHeader: () => pdf.font(fontPath),
            font: fontPath,
            hideHeader: true,
            divider: {
                horizontal: { disabled: true, width: 0.5, opacity: 0.5 }
            },
        };
        pdf
            .font(`${__dirname}/../fonts/times_new_roman.ttf`)
            .text(link, { underline: true })
            .moveDown()
            .table(table, tableOptions);

        pdf.moveDown(2);
    });
    pdf.end();
    return pdf;
};