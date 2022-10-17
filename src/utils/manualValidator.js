import Joi from'joi';

const isSingleNameHost = (url) => url.includes('.');

const isValidUrl = (url) => {
    const schema = Joi.string().uri();
    const firstValidation = schema.validate(url);
    return firstValidation?.error ? false : isSingleNameHost(url);
}

export const validateUrls = (urls) => urls
    .reduce((acc, url) => isValidUrl(url) ? acc : [...acc, url], []);
