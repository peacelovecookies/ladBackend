import _ from 'lodash';
import jsdom from "jsdom";
import axios from 'axios';
import PDFDocument from 'pdfkit';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const { JSDOM } = jsdom;

const tagsWithText = ["li", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6"]; // add or remove tags if it's needed

const addWords = (wordsCount, innerText) => innerText
    .split(' ')
    .forEach((word) => {
        if (word.length > 3) {
            wordsCount[word] = _.get(wordsCount, word, 0) + 1;
        }
    })

const collectWords = (data) => {
    const { window: { document: { body } } } = new JSDOM(data);
    const wordsCount = {};
    body
        .querySelectorAll('*') // this method may be not super accurate, since textContent takes non-human-readable content... need to refactor this sh*t in the future
        .forEach((node) => {
            const tag = node.tagName.toLowerCase();
            if (tagsWithText.includes(tag)) {
                const { textContent } = node;
                if (textContent && textContent !== '') addWords(wordsCount, textContent);
            }
        });
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
    const pdf = new PDFDocument();
    // in this case we don't add result of rejected requests... keep it in mind
    fulfilled.forEach((dataObj) => {
        const { url: link } = dataObj.value;
        const topList = dataObj?.value?.topList.join('  |  ');
        pdf
            .font(`${__dirname}/../fonts/times_new_roman.ttf`)
            .text(link, { underline: true })
            .moveDown()
            .text(topList, { align: 'justify' })
            .moveDown(2)
    });
    pdf.end();
    return pdf;
};