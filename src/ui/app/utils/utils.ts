import {
  fnDebounceFn,
  objType
} from '../types';

// 存储单位转换
export function formatSizeStr(sizeStr: number | string, unit?: string, flag?: boolean): string {
  // sizeStr为传入的数据大小
  // unit为初始数据的单位，默认为B
  // flag为把0处理为0+单位[unit]
  if (sizeStr === '--') return '--';
  if (Number(sizeStr) === 0 && flag) return `0 ${unit}`;
  if (Number(sizeStr) === 0) return '0';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(Number(sizeStr)) / Math.log(k));
  i = i < 0 ? 0 : i;
  let item: unknown = Number(sizeStr) / (k ** i); // k ** i 等同于 Math.pow(k, i)
  if (parseInt(item as string, 10) !== item) {
    item = Number((item as object).toString().match(/^\d+(?:\.\d{0,2})?/));
  }
  if (unit) {
    for (let j = 0; j < sizes.length; j += 1) {
      if (sizes[j] === unit) {
        i += j;
      }
    }
  }
  return `${item} ${sizes[i]}`;
}


/**
 * [deepComparison 深比较]
 * @param  {[any]} data [any]
 * @return {[Boolean]}      [是否相同]
 */
export function deepComparison(data1: unknown, data2: unknown) : boolean {
  const { hasOwnProperty } = Object.prototype;

  // 获取变量类型
  const getType = (d: unknown) : string => {
    if (typeof d === 'object') {
      if (!(d instanceof Object)) {
        return 'null';
      }
      if (d instanceof Date) {
        return 'date';
      }
      if (d instanceof RegExp) {
        return 'regexp';
      }

      // object / array //
      return 'object';
    }
    if (d !== d) return 'nan';
    return (typeof d).toLowerCase();
  };

  // 基本类型比较
  const is = (d1: unknown, d2: unknown, type: string) : boolean => {
    if (type === 'nan') return true;
    if (type === 'date' || type === 'regexp') 
      return (d1 as object).toString() === (d2 as object).toString();
    return (d1 === d2);
  };

  // 递归比较
  const compare = (d1: unknown, d2: unknown) : boolean => {
    const type1 = getType(d1);
    const type2 = getType(d2);

    if (type1 !== type2) {
      return false;
    }

    if (type1 === 'object') {
      const keys1: any[] = Object.keys(d1 as objType).filter(k => hasOwnProperty.call(d1, k));
      const keys2: any[] = Object.keys(d2 as objType).filter(k => hasOwnProperty.call(d2, k));
      if (keys1.length !== keys2.length) {
        return false;
      }
      for (let i = 0; i < keys1.length; i += 1) {
        if (
          !keys2.includes(keys1[i]) ||
          !compare(
            (d1 as objType)[keys1[i]],
            (d2 as objType)[keys1[i]])
          ) {
          return false;
        }
      }
      return true;
    }
    return is(d1, d2, type1);
  };

  return compare(data1, data2);
}

/**
   * @param  {Function} fn         [回调函数]
   * @param  {[Time]}   delayTime  [延迟时间(ms)]
   * @param  {Boolean}  isImediate [是否需要立即调用]
   * @param  {[type]}   args       [回调函数传入参数]
  */
 export function fnDebounce(): {(
   fn: fnDebounceFn,
   delayTime: number,
   isImediate: boolean,
   args: unknown
   ): unknown} {
  const fnObject = new WeakMap();
  let timer:number;

  return (fn: fnDebounceFn, delayTime: number, isImediate: boolean, args: unknown) => {
    // 设置定时器方法
    const setTimer = () => {
      timer = window.setTimeout(() => {
        fn(args);
        // 清除定时器
        clearTimeout(timer);
        fnObject.delete(fn);
      }, delayTime);

      fnObject.set(fn, timer);
    };

    // 立即调用
    if (!delayTime || isImediate) return fn(args);

    // 判断函数是否已经在调用中
    if (fnObject.get(fn)) {
      clearTimeout(timer);
      // 定时器
      setTimer();
    } else {
      // 定时器
      setTimer();
    }
  };
}