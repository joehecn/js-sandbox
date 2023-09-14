import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

type SafeAny = any;

type Mark = {
  fatherType: string;
  start: number;
  end: number;
  locations: number[];
  count: number;
};

export type CustomFunction = {
  functionName: string;
  arrowGlobalFunction?: SafeAny;
  arrowSandboxFunctionStr?: string;
};

export type JsSandboxOption = {
  entry?: string;
  systemFunctions?: string[];
  customFunctions?: CustomFunction[];
};

export type RunOption = SafeAny;

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
  private _entry = 'main';
  // 全局系统函数
  private _systemFunctions: string[];
  // 全局自定义函数
  private _customFunctions: CustomFunction[] = [];

  constructor(option?: JsSandboxOption) {
    const { entry = '', systemFunctions = _ALLOW_SYSTEM_FUNCTIONS, customFunctions = [] } = option || {};

    if (entry) this._entry = entry;

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
      function warp () {
        const __JS_SANDBOX_COVERAGE_START_ARR__ = []

        function __JS_SANDBOX_COVERAGE_FUN__(start) {
          __JS_SANDBOX_COVERAGE_START_ARR__.push(start)
        }

        const option = JSON.parse(__OPTION__)
  
        ${atobStr}
  
        ${customFunctionArr.join('')}
  
        ${fun}
  
        const res = ${this._entry}(option)
        return { res, __JS_SANDBOX_COVERAGE_START_ARR__ }
      }

      warp()
    `;
  }

  private _parse(fun: string): acorn.Node {
    return acorn.parse(fun, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: true,
    });
  }

  private _instrument(sourceAst: acorn.Node) {
    const marks: Mark[] = [];

    const nodeSet = new Set();
    const nodeFatherMap = new WeakMap();
    const ancestorWeakSet = new WeakSet();

    walk.ancestor(sourceAst, {
      Statement(node: acorn.Node, ancestors: acorn.Node[]) {
        // tslint:disable-next-line: no-console
        console.log(ancestors.map((n) => n.type));

        nodeSet.add(node);

        ancestors.pop();

        if (ancestors.length === 0) return;

        nodeFatherMap.set(node, (ancestors.at(-1) as acorn.Node).type);

        ancestors.forEach((n) => {
          ancestorWeakSet.add(n);
        });
      },
    });

    for (const n of nodeSet) {
      const node = n as acorn.Node;
      if (!ancestorWeakSet.has(node)) {
        const fatherType = nodeFatherMap.get(node) ?? '';
        const { start, end, loc } = node;
        const { start: s, end: e } = loc!;

        marks.push({
          fatherType,
          start,
          end,
          locations: [s.line, s.column, e.line, e.column],
          count: 0,
        });
      }
    }

    return marks.sort((a, b) => b.start - a.start);
  }

  private _generate(fun: string, marks: Mark[]): string {
    for (let i = 0, len = marks.length; i < len; i++) {
      const { fatherType, start, end } = marks[i];

      if (['IfStatement'].includes(fatherType)) {
        fun = `${fun.slice(0, start)}{__JS_SANDBOX_COVERAGE_FUN__(${start});${fun.slice(start, end)}}${fun.slice(end)}`;
      } else {
        fun = `${fun.slice(0, start)}
        __JS_SANDBOX_COVERAGE_FUN__(${start});${fun.slice(start)}`;
      }
    }

    // tslint:disable-next-line: no-console
    console.log(fun);
    return fun;
  }

  private _runCodeSafe(fun: string, option?: RunOption, entry?: string) {
    if (entry) this._entry = entry;

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
        const optionHandle = context.newString(JSON.stringify(option ?? {}));
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

  // TODO: Run on server side
  public async runCodeSafe(fun: string, option?: RunOption, entry?: string) {
    const result = await this._runCodeSafe(fun, option, entry);
    const { res } = result as SafeAny;
    return res;
  }

  // Coverage
  public async tests(fun: string, options: RunOption[], entry?: string) {
    const _setMarksCount = (marks: Mark[], startArr: number[]) => {
      for (let i = 0, len = startArr.length; i < len; i++) {
        const start = startArr[i];
        const mark = marks.find((item) => item.start === start);
        if (mark) mark.count++;
      }
    };

    // parse to AST
    const sourceAst = this._parse(fun);

    // instrument
    const marks = this._instrument(sourceAst);

    // generate
    const generateCode = this._generate(fun, marks);

    // loop run code
    const promiseArr = [];
    for (let i = 0, len = options.length; i < len; i++) {
      const option = options[i];
      promiseArr.push(this._runCodeSafe(generateCode, option, entry));
    }

    const promiseResults = await Promise.all(promiseArr);

    const results = [];
    for (let i = 0, len = promiseResults.length; i < len; i++) {
      const { res, __JS_SANDBOX_COVERAGE_START_ARR__ } = promiseResults[i] as SafeAny;
      _setMarksCount(marks, __JS_SANDBOX_COVERAGE_START_ARR__);
      results.push(res);
    }
    return { results, marks };
  }
}

export default JsSandbox;
