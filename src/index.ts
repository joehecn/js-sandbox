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

export type JsSandboxOption = {
  mainFunction?: string;
  systemFunctions?: string[];
};
export type SafeAny = any;
export type RunOption = { [key: string]: SafeAny } | null; // | SafeAny[]

const _ALLOW_SYSTEM_FUNCTIONS = ['console.log', 'btoa', 'atob'];

class JsSandbox {
  // 入口函数
  private _mainFunction = '';
  // 全局系统函数
  private _systemFunctions: string[];
  private _quickjs: SafeAny;

  constructor(option?: JsSandboxOption) {
    const {
      mainFunction = '',
      systemFunctions = _ALLOW_SYSTEM_FUNCTIONS
    } = option || {};
    
    this._mainFunction = mainFunction;
    this._systemFunctions = this._getSystemFunctions(systemFunctions);
  }

  private _getSystemFunctions(systemFunctions: string[]) {
    const set = new Set<string>();

    for (let i = 0, len = systemFunctions.length; i < len; i++) {
      const func = systemFunctions[i];
      if (_ALLOW_SYSTEM_FUNCTIONS.includes(func)) {
        set.add(func);
      } else {
        throw new Error(`system function: ${func} is not allow`);
      }
    }

    return Array.from(set);
  }

  public async init() {
    this._quickjs = await getQuickJS();
  }

  public runCodeSafe(fun: string, option: RunOption, mainFunction?: string) {
    // const { DecodeOrEncode } = _parseFun(fun);
    if (mainFunction) this._mainFunction = mainFunction;

    if (!this._mainFunction) throw new Error('main function is not defined');

    return new Promise((resolve, reject) => {
      if(!this._quickjs) return reject('quickjs not init');
      // 运行时
      const runtime = this._quickjs.newRuntime();
      runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 3000));
      runtime.setMemoryLimit(1024 * 640);
      runtime.setMaxStackSize(1024 * 320);

      const context = runtime.newContext();

      // 全局系统函数
      if (this._systemFunctions.includes('console.log')) {
        // console.log
        const logHandle = context.newFunction('log', (...args: SafeAny[]) => {
          const nativeArgs = args.map(context.dump);
          // tslint:disable-next-line: no-console
          console.log('[JS-SANDBOX]:', ...nativeArgs);
        });
        const consoleHandle = context.newObject();
        context.setProp(consoleHandle, 'log', logHandle);
        context.setProp(context.global, 'console', consoleHandle);
        consoleHandle.dispose();
        logHandle.dispose();
      }
      if (this._systemFunctions.includes('btoa')) {
        // btoa
        const btoaHandle = context.newFunction('btoa', (...args: SafeAny[]) => {
          const nativeArg = context.dump(args[0]);
          const res = btoa(nativeArg);
  
          return context.newString(res);
        });
        context.setProp(context.global, 'btoa', btoaHandle);
        btoaHandle.dispose();
      }
      if (this._systemFunctions.includes('atob')) {
        // atob
        // ---- ATOB_STRING
        const ATOB_STRING_HANDLE = context.newFunction('ATOB_STRING', (...args: SafeAny[]) => {
          const str = context.dump(args[0]);
          const res = ATOB_STRING(str);
  
          return context.newString(res!);
        });
        context.setProp(context.global, 'ATOB_STRING', ATOB_STRING_HANDLE);
        ATOB_STRING_HANDLE.dispose();
      }

      // 全局自定义函数
      // ---- T_M_FLOAT_AB_CD
      const T_M_FLOAT_AB_CD_HANDLE = context.newFunction('T_M_FLOAT_AB_CD', (...args: SafeAny[]) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_FLOAT_AB_CD(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_AB_CD', T_M_FLOAT_AB_CD_HANDLE);
      T_M_FLOAT_AB_CD_HANDLE.dispose();

      // ---- T_M_FLOAT_CD_AB
      const T_M_FLOAT_CD_AB_HANDLE = context.newFunction('T_M_FLOAT_CD_AB', (...args: SafeAny[]) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_FLOAT_CD_AB(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_CD_AB', T_M_FLOAT_CD_AB_HANDLE);
      T_M_FLOAT_CD_AB_HANDLE.dispose();

      // ---- T_M_LONG_AB_CD
      const T_M_LONG_AB_CD_HANDLE = context.newFunction('T_M_LONG_AB_CD', (...args: SafeAny[]) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_LONG_AB_CD(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_LONG_AB_CD', T_M_LONG_AB_CD_HANDLE);
      T_M_LONG_AB_CD_HANDLE.dispose();

      // ---- T_M_LONG_CD_AB
      const T_M_LONG_CD_AB_HANDLE = context.newFunction('T_M_LONG_CD_AB', (...args: SafeAny[]) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_LONG_CD_AB(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_LONG_CD_AB', T_M_LONG_CD_AB_HANDLE);
      T_M_LONG_CD_AB_HANDLE.dispose();

      // ---- T_M_SIGNED
      const T_M_SIGNED_HANDLE = context.newFunction('T_M_SIGNED', (...args: SafeAny[]) => {
        const arr = context.dump(args[0]);
        const skip = context.dump(args[1]);
        const res = T_M_SIGNED(arr, skip);

        return context.newNumber(res!);
      });
      context.setProp(context.global, 'T_M_SIGNED', T_M_SIGNED_HANDLE);
      T_M_SIGNED_HANDLE.dispose();

      // ---- T_M_FLOAT_AB_CD_R_STRING
      const T_M_FLOAT_AB_CD_R_STRING_HANDLE = context.newFunction('T_M_FLOAT_AB_CD_R_STRING', (...args: SafeAny[]) => {
        const num = context.dump(args[0]);
        const res = T_M_FLOAT_AB_CD_R_STRING(num);

        return context.newString(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_AB_CD_R_STRING', T_M_FLOAT_AB_CD_R_STRING_HANDLE);
      T_M_FLOAT_AB_CD_R_STRING_HANDLE.dispose();

      // ---- T_M_FLOAT_CD_AB_R_STRING
      const T_M_FLOAT_CD_AB_R_STRING_HANDLE = context.newFunction('T_M_FLOAT_CD_AB_R_STRING', (...args: SafeAny[]) => {
        const num = context.dump(args[0]);
        const res = T_M_FLOAT_CD_AB_R_STRING(num);

        return context.newString(res!);
      });
      context.setProp(context.global, 'T_M_FLOAT_CD_AB_R_STRING', T_M_FLOAT_CD_AB_R_STRING_HANDLE);
      T_M_FLOAT_CD_AB_R_STRING_HANDLE.dispose();

      // ---- T_U_XML_TO_JSON_STRING
      const T_U_XML_TO_JSON_STRING_HANDLE = context.newFunction('T_U_XML_TO_JSON_STRING', (...args: SafeAny[]) => {
        const xml = context.dump(args[0]);
        const options = context.dump(args[1]);
        const res = T_U_XML_TO_JSON_STRING(xml, options);

        return context.newString(res!);
      });
      context.setProp(context.global, 'T_U_XML_TO_JSON_STRING', T_U_XML_TO_JSON_STRING_HANDLE);
      T_U_XML_TO_JSON_STRING_HANDLE.dispose();

      // 全局参数
      const optionHandle = context.newString(JSON.stringify(option));
      context.setProp(context.global, 'OPTION', optionHandle);
      optionHandle.dispose();

      const code = `
        const option = JSON.parse(OPTION)

        const atob = str => {
          const res = ATOB_STRING(str)
          const arr = JSON.parse(res)

          return String.fromCharCode(...arr)
        }

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

        const T_A_GET_STATUS = () => {
          return option.__STATUS__ || option.status;
        }

        const T_H_GET_VALIDATE_CODE = customID => {
          return 'fu2021square'
        }

        ${fun}

        ${this._mainFunction}(option)
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
  }
}

export default JsSandbox;
