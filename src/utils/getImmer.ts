import { Immer, enableES5 } from 'immer';

const immer = new Immer({
  autoFreeze: false,
});

/**
 * support for the fallback implementation has to be explicitly enabled
 * @link https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
 * @since immer 6.0
 */
enableES5();

export const getImmer = () => immer;
