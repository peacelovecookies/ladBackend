'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('joi');
const axios = require('axios');
const domParser = require("htmlparser2");

const isSingleNameHost = (url) => url.includes('.');

const isValidUrl = (url) => {
    const schema = Joi.string().uri();
    const firstValidation = schema.validate(url);
    return firstValidation?.error ? false : isSingleNameHost(url);
}

const validateUrls = (urls) => urls
    .reduce((acc, url) => isValidUrl(url) ? acc : [...acc, url], []);

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'POST',
        path: '/anylizeUrls',
        handler: async (request, h) => {
            const { urls } = request.payload;
            const invalidUrls = validateUrls(urls); // Collect all invalid urls for reply
            if (invalidUrls.length > 0) {
                return h.response(`Provided links are invalid: ${invalidUrls.join(', ')}. Please fix them, then try again.`).code(400);
            }

            const promises = urls.map(async (url) => {
                const { data } = await axios.get(url);
	            const doc = domParser.parseDocument(data);
                console.log('test: ', doc);
                return { url, err: [], data };
            });

            return await Promise.all(promises);
        },

        // We can use default validator, but it excludes local domains (single label domain, I guess)
        // options: {
        //     auth: false,
        //     validate: {
        //         payload: Joi.object({
        //             urls: Joi.array().items(Joi.string().uri())
        //         })
        //     }
        // }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();