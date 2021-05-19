function isObject (value) {
  return value && typeof value === 'object';
}

function isArray (value) {
  return value instanceof Array;
}

export {
  isObject,
  isArray
};
