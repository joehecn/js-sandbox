import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';

import {
  T_M_FLOAT_AB_CD,
  T_M_FLOAT_CD_AB,
  T_M_LONG_AB_CD,
  T_M_LONG_CD_AB,
  T_M_SIGNED,
  T_M_FLOAT_AB_CD_R_STRING,
  T_M_FLOAT_CD_AB_R_STRING,
  T_U_XML_TO_JSON_STRING,
  ATOB_STRING,
} from './browser';

export type SafeAny = any;
export type RunOption = { [key: string]: SafeAny } | null; // | SafeAny[]

const _parseFun = (fun: string) => {
  const _IN_FUN_SET = new Set<string>();

  const parsed = acorn.parse(fun, { ecmaVersion: 2020 });

  walk.full(parsed, (node, _, type) => {
    if (type === 'Function') {
      const _node = node as SafeAny;
      const name = _node.id?.name;
      if (name) _IN_FUN_SET.add(name);
    } else if (type === 'Identifier') {
      const _node = node as SafeAny;
      const name = _node.name;

      if (['T_M_FLOAT_AB_CD'].includes(name)) {
        _IN_FUN_SET.add(name);
      }
    }
  });

  return { DecodeOrEncode: _IN_FUN_SET.has('Decode') ? 'Decode' : 'Encode' };
};

export function runCodeSafe(fun: string, option: RunOption) {
  const { DecodeOrEncode } = _parseFun(fun);

  return new Promise((resolve, reject) => {
    getQuickJS().then((QuickJS) => {
      // 运行时
      const runtime = QuickJS.newRuntime();
      runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 3000));
      runtime.setMemoryLimit(1024 * 640);
      runtime.setMaxStackSize(1024 * 320);

      const context = runtime.newContext();

      // 全局函数

      const logHandle = context.newFunction('log', (...args) => {
        const nativeArgs = args.map(context.dump);
        // tslint:disable-next-line: no-console
        console.log('[JS-SANDBOX]:', ...nativeArgs);
      });
      const consoleHandle = context.newObject();
      context.setProp(consoleHandle, 'log', logHandle);
      context.setProp(context.global, 'console', consoleHandle);
      consoleHandle.dispose();
      logHandle.dispose();

      // btoa
      const btoaHandle = context.newFunction('btoa', (...args) => {
        const nativeArg = context.dump(args[0]);
        const res = btoa(nativeArg);

        return context.newString(res);
      });
      context.setProp(context.global, 'btoa', btoaHandle);
      btoaHandle.dispose();

      // ---- T_M_FLOAT_AB_CD
      const T_M_FLOAT_AB_CD_HANDLE = context.newFunction('T_M_FLOAT_AB_CD', (...args) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_FLOAT_AB_CD(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_AB_CD', T_M_FLOAT_AB_CD_HANDLE);
      T_M_FLOAT_AB_CD_HANDLE.dispose();

      // ---- T_M_FLOAT_CD_AB
      const T_M_FLOAT_CD_AB_HANDLE = context.newFunction('T_M_FLOAT_CD_AB', (...args) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_FLOAT_CD_AB(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_CD_AB', T_M_FLOAT_CD_AB_HANDLE);
      T_M_FLOAT_CD_AB_HANDLE.dispose();

      // ---- T_M_LONG_AB_CD
      const T_M_LONG_AB_CD_HANDLE = context.newFunction('T_M_LONG_AB_CD', (...args) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_LONG_AB_CD(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_LONG_AB_CD', T_M_LONG_AB_CD_HANDLE);
      T_M_LONG_AB_CD_HANDLE.dispose();

      // ---- T_M_LONG_CD_AB
      const T_M_LONG_CD_AB_HANDLE = context.newFunction('T_M_LONG_CD_AB', (...args) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_LONG_CD_AB(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_LONG_CD_AB', T_M_LONG_CD_AB_HANDLE);
      T_M_LONG_CD_AB_HANDLE.dispose();

      // ---- T_M_SIGNED
      const T_M_SIGNED_HANDLE = context.newFunction('T_M_SIGNED', (...args) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_SIGNED(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_SIGNED', T_M_SIGNED_HANDLE);
      T_M_SIGNED_HANDLE.dispose();

      // ---- T_M_FLOAT_AB_CD_R_STRING
      const T_M_FLOAT_AB_CD_R_STRING_HANDLE = context.newFunction('T_M_FLOAT_AB_CD_R_STRING', (...args) => {
        const num = context.dump(args[0]);
        const res = T_M_FLOAT_AB_CD_R_STRING(num);

        return context.newString(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_AB_CD_R_STRING', T_M_FLOAT_AB_CD_R_STRING_HANDLE);
      T_M_FLOAT_AB_CD_R_STRING_HANDLE.dispose();

      // ---- T_M_FLOAT_CD_AB_R_STRING
      const T_M_FLOAT_CD_AB_R_STRING_HANDLE = context.newFunction('T_M_FLOAT_CD_AB_R_STRING', (...args) => {
        const num = context.dump(args[0]);
        const res = T_M_FLOAT_CD_AB_R_STRING(num);

        return context.newString(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_CD_AB_R_STRING', T_M_FLOAT_CD_AB_R_STRING_HANDLE);
      T_M_FLOAT_CD_AB_R_STRING_HANDLE.dispose();

      // ---- T_U_XML_TO_JSON_STRING
      const T_U_XML_TO_JSON_STRING_HANDLE = context.newFunction('T_U_XML_TO_JSON_STRING', (...args) => {
        const xml = context.dump(args[0]);
        const options = context.dump(args[1]);
        const res = T_U_XML_TO_JSON_STRING(xml, options);

        return context.newString(res!);
      });
      context.setProp(context.global, 'T_U_XML_TO_JSON_STRING', T_U_XML_TO_JSON_STRING_HANDLE);
      T_U_XML_TO_JSON_STRING_HANDLE.dispose();

      // ---- ATOB_STRING
      const ATOB_STRING_HANDLE = context.newFunction('ATOB_STRING', (...args) => {
        const str = context.dump(args[0]);
        const res = ATOB_STRING(str);

        return context.newString(res!);
      });
      context.setProp(context.global, 'ATOB_STRING', ATOB_STRING_HANDLE);
      ATOB_STRING_HANDLE.dispose();

      // 全局参数
      const optionHandle = context.newString(JSON.stringify(option));
      context.setProp(context.global, 'OPTION', optionHandle);
      optionHandle.dispose();

      const code = `
        const option = JSON.parse(OPTION)

        const T_M_FLOAT_AB_CD_R = num => {
          const res = T_M_FLOAT_AB_CD_R_STRING(num)
          return JSON.parse(res)
        }

        const T_M_FLOAT_CD_AB_R = num => {
          const res = T_M_FLOAT_CD_AB_R_STRING(num)
          return JSON.parse(res)
        }

        const T_U_XML_TO_JSON = (xml, option) => {
          const res = T_U_XML_TO_JSON_STRING(xml, option)
          return JSON.parse(res)
        }

        const atob = str => {
          const res = ATOB_STRING(str)
          const arr = JSON.parse(res)

          return String.fromCharCode(...arr)
        }

        const T_A_GET_STATUS = () => {
          return option.__STATUS__ || option.status;
        }

        const T_H_GET_VALIDATE_CODE = customID => {
          return 'fu2021square'
        }

        ${fun}

        ${DecodeOrEncode}(option)
      `;

      const result = context.evalCode(code);

      if (result.error) {
        reject(context.dump(result.error));
        result.error.dispose();
      } else {
        resolve(context.dump(result.value));
        result.value.dispose();
      }

      context.dispose();
      runtime.dispose();
    });
  });
}
