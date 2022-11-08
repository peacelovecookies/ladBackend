import { describe, expect, test } from '@jest/globals';

import { validateUrls } from '../../../src/utils/manualValidator.js';


describe('Manual validation of incoming urls', () => {
  test('invalid urls', () => {
    const invalidUrls = [5, 'invalid.url', 'http://'];
    const result = validateUrls(invalidUrls);

    expect(result.length).toBe(invalidUrls.length);
    expect(result).toEqual(invalidUrls);
  });
 
  test('single-name domains', () => {
    const invalidUrls = ['http://hey', 'https://single-name-domain', 'http://localhost:9090'];
    const result = validateUrls(invalidUrls);

    expect(result.length).toBe(invalidUrls.length);
    expect(result).toEqual(invalidUrls);
  });

  test('valid urls', () => {
    const invalidUrls = ['http://google.com', 'https://ipotekabank.uz', 'https://docs.google.com'];
    const result = validateUrls(invalidUrls);

    expect(result).toEqual([]);
  });
});

// Check up these cases:
// Method should return an array with invalid urls
// Method should return an array with single-name domains
// Method should return an empty array when http, https urls are used.