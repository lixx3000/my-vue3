import { isObject } from './utils.js';

function reactive (obj) {
  // 这里会判断对象是否为只读属性，如果是的话，就不会进行代理
  if (obj && obj.IS_READONLY) {
    return obj;
  }
  return createReactiveObject(obj);
}

function createReactiveObject (obj) {
  if (!isObject(obj)) return obj;
  // 源码里会通过TargetType.COLLECTION属性判断是否为Map和Set类型对象，做不同的代理
  return new Proxy(obj, {
    get (target, key, receiver) {
      if (!target.IS_READONLY) {
        track(target, key);
      }
      const value = Reflect.get(target, key, receiver)
      return reactive(value);
    },
    set (target, key, value, receiver) {
      trigger(target, key);
      return Reflect.set(target, key, value, receiver)
    },
    deleteProperty (target, key) {
      return Reflect.deleteProperty(target, key);
    }
  });
}

// 通过effectStack和targetsMap将watchEffect函数监听的函数里面的响应式数据收集起来
// effectStack设计成数组的优点是防止watchEffect内部嵌套watchEffect函数
const effectStack = [];
const targetsMap = new WeakMap();
function track (target, key) {
  const fn = effectStack[effectStack.length - 1];
  if (!fn) return;
  let map = targetsMap.get(target);
  if (!map) targetsMap.set(target, map = new Map());
  let fns = map.get(key);
  if (!fns) map.set(key, fns = new Set());
  fns.add(fn);
}

function trigger (target, key) {
  let map = targetsMap.get(target);
  if (!map) return;
  let fns = map.get(key);
  fns && fns.forEach(fn => fn());
}

function createReactiveEffect (fn, options) {
  return function () {
    try {
      // 执行fn的时候触发里面数据的get，get触发track，由于effectStack存在函数，所以进行收集
      effectStack.push(fn);
      return fn();
    } finally {
      effectStack.pop();
    }
  }
}

function watchEffect (fn, options = Object.create(null)) {
  // 包装回调函数
  const effect = createReactiveEffect(fn, options);
  // 如果不是计算属性就立即执行
  if (!options.lazy) {
    effect();
  }
  return effect;
}


export {
  reactive,
  watchEffect
}
