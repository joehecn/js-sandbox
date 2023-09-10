import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';

type SafeAny = any;

export type CustomFunction = {
  functionName: string;
  arrowGlobalFunction?: SafeAny;
  arrowSandboxFunctionStr?: string;
};

export type JsSandboxOption = {
  mainFunction?: string;
  systemFunctions?: string[];
  customFunctions?: CustomFunction[];
};

export type RunOption = { [key: string]: SafeAny } | null; // | SafeAny[]

const _ALLOW_SYSTEM_FUNCTIONS = ['console.log', 'btoa', 'atob'];

const ATOB__JSON__ = (...args: unknown[]) => {
  const str = args[0];
  const raw = atob(str as string);

  const arr = [];
  for (let i = 0; i < raw.length; i++) {
    arr.push(raw.charCodeAt(i));
  }

  return String.fromCharCode(...arr);
};

class JsSandbox {
  // 入口函数
  private _mainFunction = '';
  // 全局系统函数
  private _systemFunctions: string[];
  // 全局自定义函数
  private _customFunctions: CustomFunction[] = [];

  constructor(option?: JsSandboxOption) {
    const { mainFunction = '', systemFunctions = _ALLOW_SYSTEM_FUNCTIONS, customFunctions = [] } = option || {};

    this._mainFunction = mainFunction;
    this._systemFunctions = this._getSystemFunctions(systemFunctions);
    this._customFunctions = this._getCustomFunctions(customFunctions);
  }

  private _getSystemFunctions(systemFunctions: string[]) {
    const set = new Set<string>();

    for (let i = 0, len = systemFunctions.length; i < len; i++) {
      const func = systemFunctions[i];
      if (_ALLOW_SYSTEM_FUNCTIONS.includes(func)) {
        set.add(func);
      } else {
        throw new Error(`[JS-SANDBOX] system function: ${func} is not allow!`);
      }
    }

    return Array.from(set);
  }

  private _getCustomFunctions(customFunctions: CustomFunction[]) {
    const set = new Set<string>(customFunctions.map((item) => item.functionName));
    const arr = Array.from(set);
    if (arr.length !== customFunctions.length) throw new Error('[JS-SANDBOX] custom function name is not unique!');

    return customFunctions;
  }

  private _getCode(fun: string) {
    let atobStr = '';
    if (this._systemFunctions.includes('atob')) {
      atobStr = `
        const atob = (...args) => {
          const json = ATOB__JSON__(...args)
          const { res } = JSON.parse(json)
          return res
        }
      `;
    }

    const customFunctionArr = [];
    for (let i = 0, len = this._customFunctions.length; i < len; i++) {
      const { functionName, arrowGlobalFunction, arrowSandboxFunctionStr } = this._customFunctions[i];

      if (arrowGlobalFunction) {
        customFunctionArr.push(`
          const ${functionName} = (...args) => {
            const json = ${functionName}__JSON__(...args)
            const { res } = JSON.parse(json)
            return res
          }
        `);
      } else if (arrowSandboxFunctionStr) {
        customFunctionArr.push(`
          const ${functionName} = ${arrowSandboxFunctionStr}
        `);
      }
    }

    return `
      const option = JSON.parse(__OPTION__)

      ${atobStr}

      ${customFunctionArr.join('')}

      ${fun}

      ${this._mainFunction}(option)
    `;
  }

  public runCodeSafe(fun: string, option: RunOption, mainFunction?: string) {
    if (mainFunction) this._mainFunction = mainFunction;

    if (!this._mainFunction) throw new Error('[JS-SANDBOX] main function is not defined!');

    return new Promise((resolve, reject) => {
      getQuickJS().then((quickjs) => {
        // 运行时
        const runtime = quickjs.newRuntime();
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
            console.log('[JS-SANDBOX]', ...nativeArgs);
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
          // ---- ATOB
          const ATOB_HANDLE = context.newFunction('ATOB__JSON__', (...args: SafeAny[]) => {
            const nativeArgs = args.map(context.dump);
            const res = ATOB__JSON__(...nativeArgs);
            return context.newString(JSON.stringify({ res }));
          });
          context.setProp(context.global, 'ATOB__JSON__', ATOB_HANDLE);
          ATOB_HANDLE.dispose();
        }

        // 全局自定义函数
        for (let i = 0, len = this._customFunctions.length; i < len; i++) {
          const { functionName, arrowGlobalFunction } = this._customFunctions[i];
          if (!arrowGlobalFunction) continue;

          const jsonName = `${functionName}__JSON__`;

          const handle = context.newFunction(jsonName, (...args: SafeAny[]) => {
            const nativeArgs = args.map(context.dump);
            const res = arrowGlobalFunction(...nativeArgs);

            return context.newString(JSON.stringify({ res }));
          });
          context.setProp(context.global, jsonName, handle);
          handle.dispose();
        }

        // 全局参数
        const optionHandle = context.newString(JSON.stringify(option));
        context.setProp(context.global, '__OPTION__', optionHandle);
        optionHandle.dispose();

        const code = this._getCode(fun);

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
}

export default JsSandbox;
