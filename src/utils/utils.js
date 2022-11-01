import _ from 'lodash';
import axios from 'axios';
import PDFDocument from 'pdfkit-table';
import path from 'path';
import { htmlToText } from 'html-to-text';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const fontPath = path.join(__dirname, '..', 'fonts/times_new_roman.ttf');

const addWord = (acc, word) => {
    if (word.length > 3) {
        acc[word] = _.get(acc, word, 0) + 1;
    }
    return acc;
};

const collectWords = (data) => {
    try {
        const content = htmlToText(data);
        return content
            .split(/\s+/)
            .reduce(addWord, {});
    } catch(e) { // yet I don't really know how this method works, so I have to catch any possible error to analyze and handle it in the future
        throw e;
    }
};

const getTop = (count, obj) => Object
                                .entries(obj)
                                .sort(([, val1], [, val2]) => val2 - val1)
                                .slice(0, count)
                                .map(([key]) => key);

export const getMostFrequentWords = (wordsCount, urls, timeout = 5000) => urls.map(async (url) => {
    try {
        const { data } = await axios.get(url, { timeout });
        const words = collectWords(data);
        const topList = getTop(wordsCount, words);
        return { url, topList };
    } catch(e) {
        const err = new Error()
        err.name = e.name;
        err.url = e.config.url;
        err.message = `Houston, we've got a problem with fetching data: '${e.message}'`;
        err.code = e.code;
        throw err;
    }
});

const fulfilledHandler = (pdf) => (dataObj) => {
    const { url: link } = dataObj.value;
    const { topList } = dataObj?.value;
    const table = { 
        title: '',
        headers: topList, // we won't see header anyway, but without it method will throw an error
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
        .font(fontPath)
        .fontSize(12)
        .text(link, { underline: true })
        .moveDown()
        .table(table, tableOptions); // that's pitty, but table doesn't return an object, so we can't use pipeline

    pdf.moveDown(2);
};

const rejectedHandler = (pdf) => (dataObj) => {
    const { url: link } = dataObj.reason;
    
    pdf
        .font(fontPath)
        .fontSize(12)
        .text(link, { underline: true })
        .moveDown()
        // .font(fontPath)
        .text('Sorry we faced some problem while processing this url. You may check url and try later.')
        .moveDown(2);
};

export const generatePdf = (fetchedDataObj) => {
    const fulfilled = fetchedDataObj.filter((dataObj) => dataObj.status === 'fulfilled');
    const pdf = new PDFDocument({ margin: 30, size: 'A4' })
        .font(fontPath)
        .fontSize(20)
        .text('Results:')
        .moveDown();
    fulfilled.forEach(fulfilledHandler(pdf));

    /* if you need to handle rejected promises uncomment this part
    pdf
        .moveDown()
        .font(fontPath)
        .fontSize(20)
        .text('Problems:')
        .moveDown()

    const rejected = fetchedDataObj.filter((dataObj) => dataObj.status === 'rejected');
    rejected.forEach(rejectedHandler(pdf));
    */

    pdf.end();
    return pdf;
};