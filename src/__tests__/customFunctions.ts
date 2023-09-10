import { XMLParser } from 'fast-xml-parser';
import type { CustomFunction } from '../index';

const _getNum = (arr: number[], skip: number) => {
  const MAX_NUM = 65535; // 16位无符号整数最大值(0~65535)
  const MIN_NUM = -32768; // 16位有符号整数最小值(-32768~32767)

  const num = arr[skip];

  if (num > MAX_NUM || num < MIN_NUM) {
    throw new Error('[CUSTOM-FUNCTION] The number out of range!');
  }

  return num;
};
const _coverNumToPlus = (num: number) => {
  if (num > -1) return num;

  const MODE_16 = 65536; // 16进制负数的模
  return MODE_16 + num;
};
const _GET_BASIC_ARR = (arr: number[], skip: number) => {
  if (skip < 0 || skip + 2 > arr.length) throw new Error('[CUSTOM-FUNCTION] The skip out of range!');

  const highNum = _getNum(arr, skip);
  const lowNum = _getNum(arr, skip + 1);

  return [highNum, lowNum];
};
const _GET_BASIC_VIEW = (num0: number, num2: number) => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  view.setInt16(0, num0, false);
  view.setInt16(2, num2, false);

  return view;
};

const T_M_FLOAT_AB_CD = (arr: number[], skip: number) => {
  const [highNum, lowNum] = _GET_BASIC_ARR(arr, skip);
  const view = _GET_BASIC_VIEW(highNum, lowNum);

  return view.getFloat32(0, false);
};

const T_M_FLOAT_CD_AB = (arr: number[], skip: number) => {
  const [highNum, lowNum] = _GET_BASIC_ARR(arr, skip);
  const view = _GET_BASIC_VIEW(lowNum, highNum);

  return view.getFloat32(0, false);
};

const T_M_LONG_AB_CD = (arr: number[], skip: number) => {
  const [highNum, lowNum] = _GET_BASIC_ARR(arr, skip);
  const view = _GET_BASIC_VIEW(highNum, lowNum);

  return view.getInt32(0, false);
};

const T_M_LONG_CD_AB = (arr: number[], skip: number) => {
  const [highNum, lowNum] = _GET_BASIC_ARR(arr, skip);
  const view = _GET_BASIC_VIEW(lowNum, highNum);

  return view.getInt32(0, false);
};

const T_M_SIGNED = (arr: number[], skip: number) => {
  if (skip < 0 || skip + 1 > arr.length) throw new Error('[CUSTOM-FUNCTION] The skip out of range!');

  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);

  const num = _getNum(arr, skip);

  view.setInt16(0, num, false);

  return view.getInt16(0, false);
};

const T_M_FLOAT_AB_CD_R = (num: number) => {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  view.setFloat32(0, num, false);

  const highNum = view.getInt16(0, false);
  const lowNum = view.getInt16(2, false);

  return [_coverNumToPlus(highNum), _coverNumToPlus(lowNum)];
};
const T_M_FLOAT_CD_AB_R = (num: number) => {
  const arr = T_M_FLOAT_AB_CD_R(num);
  return arr.reverse();
};

const T_U_XML_TO_JSON = (xml: string, options = {}) => {
  const parser = new XMLParser(options);
  const document = parser.parse(xml);
  return document;
};

const customFunctions: CustomFunction[] = [
  {
    functionName: 'T_M_FLOAT_AB_CD',
    arrowGlobalFunction: T_M_FLOAT_AB_CD,
  },
  {
    functionName: 'T_M_FLOAT_CD_AB',
    arrowGlobalFunction: T_M_FLOAT_CD_AB,
  },
  {
    functionName: 'T_M_LONG_AB_CD',
    arrowGlobalFunction: T_M_LONG_AB_CD,
  },
  {
    functionName: 'T_M_LONG_CD_AB',
    arrowGlobalFunction: T_M_LONG_CD_AB,
  },
  {
    functionName: 'T_M_SIGNED',
    arrowGlobalFunction: T_M_SIGNED,
  },
  {
    functionName: 'T_M_FLOAT_AB_CD_R',
    arrowGlobalFunction: T_M_FLOAT_AB_CD_R,
  },
  {
    functionName: 'T_M_FLOAT_CD_AB_R',
    arrowGlobalFunction: T_M_FLOAT_CD_AB_R,
  },
  {
    functionName: 'T_U_XML_TO_JSON',
    arrowGlobalFunction: T_U_XML_TO_JSON,
  },
  {
    functionName: 'T_H_GET_VALIDATE_CODE',
    arrowGlobalFunction: () => {
      return 'fu2021square';
    },
  },
  {
    functionName: 'T_A_GET_STATUS',
    arrowSandboxFunctionStr: `() => {
      return option.__STATUS__ || option.status;
    }`,
  },
];

export default customFunctions;
