import { local } from './local';
import { memoryStorage } from './memory';
import { session } from './session';

/**
 * @deprecated
 */
export const engines = {
  /**
   * @deprecated 请直接使用浏览器内置的 localStorage
   */
  localStorage: local,
  /**
   * 适用于测试的memoryStorage存储引擎
   *
   * @deprecated 请从foca直接引入
   * ```typescript
   * import { memoryStorage } from 'foca';
   * ```
   */
  memoryStorage: memoryStorage,
  /**
   * @deprecated 请直接使用浏览器内置的 sessionStorage
   */
  sessionStorage: session,
} as const;
