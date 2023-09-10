// npm run test src/__tests__/product-data.spec.ts
/**
SELECT id, payload_encoder_script, payload_decoder_script, payload_encoder_option, payload_encoder_return, payload_decoder_option, payload_decoder_return, custom_id
  FROM public.device_profile;
 */

import { describe, it, expect } from 'vitest';
import JsSandbox from '../index';
import customFunctions from './customFunctions';

import csvtojson from 'csvtojson';
import path from 'path';

describe('data', () => {
  it('should be ok', async () => {
    const csvFilePath = path.resolve(__dirname, './product-data-20230909.csv');
    const arr = await csvtojson().fromFile(csvFilePath);

    for (let i = 0, len = arr.length; i < arr.length; i++) {
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

      // console.log(id, cid, i, len);

      if (def !== '') {
        const deoss = JSON.parse(deos);
        const derss = JSON.parse(ders);
        for (let j = 0, len = deoss.length; j < len; j++) {
          // console.log('---- Decode:', j);
          const deo = deoss[j];

          if (Object.hasOwnProperty.call(deo, 'status')) {
            console.log(id, cid, i, len);
            console.log('---- Decode: option.status:', deo.status);
          }

          const der = derss[j];
          const jsSandbox = new JsSandbox({
            mainFunction: 'Decode',
            customFunctions,
          });
          const res1 = await jsSandbox.runCodeSafe(def, deo);
          expect(res1).toEqual(der);
        }
      }

      if (enf !== '') {
        const enoss = JSON.parse(enos);
        const enrss = JSON.parse(enrs);
        for (let j = 0, len = enoss.length; j < len; j++) {
          // console.log('---- Encode:', j);
          const eno = enoss[j];

          if (Object.hasOwnProperty.call(eno, 'status')) {
            console.log('---- Encode: option.status:', eno.status);
          }

          const enr = enrss[j];
          const jsSandbox = new JsSandbox({
            mainFunction: 'Encode',
            customFunctions,
          });
          const res2 = await jsSandbox.runCodeSafe(enf, eno);
          expect(res2).toEqual(enr);
        }
      }
    }
  });
});
