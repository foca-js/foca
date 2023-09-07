import { Immer, enableES5 } from 'immer';

/**
 * 支持ES5，毕竟Proxy无法polyfill。有些用户手机可以10年不换！！
 * @link https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
 * @since immer@6.0
 */
enableES5();

export const immer = new Immer({
  autoFreeze: false,
});
