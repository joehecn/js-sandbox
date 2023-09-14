// npm run test src/__tests__/sandbox-data-tests.spec.ts

import { describe, it, expect } from 'vitest';
import JsSandbox from '../index';
import customFunctions from './customFunctions';

import csvtojson from 'csvtojson';
import path from 'path';

describe('sandbox data', () => {
  it('should be ok', async () => {
    const csvFilePath = path.resolve(__dirname, './sandbox-data-20230909.csv');
    const arr = await csvtojson().fromFile(csvFilePath);

    for (let i = 0, len = arr.length; i < len; i++) {
      const {
        id,
        custom_id: cid,
        payload_decoder_script: def,
        payload_decoder_option: deos,
        payload_decoder_return: ders,
        payload_encoder_script: enf,
        payload_encoder_option: enos,
        payload_encoder_return: enrs,
      } = arr[i];

      // if (id !== 'd2e5bf28-e33f-4843-ad7d-21c56e904312') continue;
      // console.log(arr[i]);

      console.log(id, cid, i, len);

      if (def !== '') {
        let deoss = JSON.parse(deos);
        let derss = JSON.parse(ders);

        if (!Array.isArray(deoss)) deoss = [deoss];
        if (!Array.isArray(derss)) derss = [derss];

        const jsSandbox = new JsSandbox({
          entry: 'Decode',
          customFunctions,
        });

        console.log('---- deoss');
        console.log(deoss);
        console.log('---- derss');
        console.log(derss);
        const { results } = await jsSandbox.tests(def, deoss);
        console.log('---- results');
        console.log(results);
        expect(results).toEqual(derss);
      }

      if (enf !== '') {
        let enoss = JSON.parse(enos);
        let enrss = JSON.parse(enrs);

        if (!Array.isArray(enoss)) enoss = [enoss];
        if (!Array.isArray(enrss)) enrss = [enrss];

        const jsSandbox = new JsSandbox({
          entry: 'Encode',
          customFunctions,
        });

        console.log('---- enoss');
        console.log(enoss);
        console.log('---- enrss');
        console.log(enrss);
        const { results } = await jsSandbox.tests(enf, enoss);
        console.log('---- results');
        console.log(results);
        expect(results).toEqual(enrss);
      }
    }
  });
});
