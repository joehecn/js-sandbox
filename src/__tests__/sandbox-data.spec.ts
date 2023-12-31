// npm run test src/__tests__/sandbox-data.spec.ts

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

        for (let j = 0, len = deoss.length; j < len; j++) {
          // console.log('---- Decode:', j);
          const deo = deoss[j];

          if (Object.hasOwnProperty.call(deo, 'status')) {
            console.log('---- Decode: option.status:', deo.status);
          }

          const der = derss[j];
          const jsSandbox = new JsSandbox({
            entry: 'Decode',
            customFunctions,
          });
          const res1 = await jsSandbox.runCodeSafe(def, deo);
          expect(res1).toEqual(der);
        }
      }

      if (enf !== '') {
        let enoss = JSON.parse(enos);
        let enrss = JSON.parse(enrs);

        if (!Array.isArray(enoss)) enoss = [enoss];
        if (!Array.isArray(enrss)) enrss = [enrss];

        for (let j = 0, len = enoss.length; j < len; j++) {
          // console.log('---- Encode:', j);
          const eno = enoss[j];

          if (Object.hasOwnProperty.call(eno, 'status')) {
            console.log('---- Encode: option.status:', eno.status);
          }

          const enr = enrss[j];
          const jsSandbox = new JsSandbox({
            entry: 'Encode',
            customFunctions,
          });
          const res2 = await jsSandbox.runCodeSafe(enf, eno);
          expect(res2).toEqual(enr);
        }
      }
    }
  });
});
