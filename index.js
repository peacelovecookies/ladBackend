'use strict';

import { validateUrls } from './src/utils/manualValidator.js';
import { getMostFrequentWords, generatePdf } from './src/utils/utils.js';
import Hapi from '@hapi/hapi';

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

            const countOfWords = 3;
            const promises = getMostFrequentWords(countOfWords, urls);
            const results = await Promise.allSettled(promises);
            
            /* use this if we need to reject the request when we get the first error
            for (let i = 0; i < results.length; i += 1) {
                const result = results[i];
                if (result.status === 'rejected') {
                    return h.response(result).code(500);
                }
            }
            */
            
            const pdf = generatePdf(results);
            return h.response(pdf);
        },

        // We can use default validator, but it excludes local domains (single label domain)
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