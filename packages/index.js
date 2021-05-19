import { ensureRenderer, createRenderer, h } from './render.js';
import { reactive, watchEffect } from './reactive.js';

function createApp (options) {
  return ensureRenderer().createApp(options)
}

export default { createApp };

export {
  createApp,
  createRenderer,
  reactive,
  watchEffect,
  h
};
