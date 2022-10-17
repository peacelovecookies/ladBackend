'use strict';

import { validateUrls } from './src/utils/manualValidator.js';
import { fetch } from './src/utils/utils.js';

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

            const promises = fetch(urls);

            return await Promise.allSettled(promises);
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