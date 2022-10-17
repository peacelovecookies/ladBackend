import _ from 'lodash';
import jsdom from "jsdom";
import axios from 'axios';

const { JSDOM } = jsdom;

const tagsWithText = ["div", "a", "li", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6"]; // add tags if it's needed

const addWords = (wordsCount, innerText) => innerText
    .split(' ')
    .forEach((word) => {
        if (word.length > 5) {
            wordsCount[word] = _.get(wordsCount, word, 0) + 1;
        }
    })

const collectWords = (data) => {
    const { window: { document: { body } } } = new JSDOM(data);
    const wordsCount = {};
    body
        .querySelectorAll('*')
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

export const fetch = (urls) => urls.map(async (url) => {
    try {
        const { data } = await axios.get(url, { timeout: 2000 });
        const wordsCount = collectWords(data);
        const topList = getTop(3, wordsCount);
        return { url, err: [], topList };
    } catch(e) {
        const err = new Error(e.message)
        err.name = e.name
        return err;
    }
});