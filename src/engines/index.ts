import { local } from './local';
import { memory } from './memory';
import { session } from './session';

export { StorageEngine } from './StorageEngine';

export const engines = {
  /**
   * 适用于浏览器的localStorage存储引擎
   */
  localStorage: local,
  /**
   * 适用于测试的memoryStorage存储引擎
   */
  memoryStorage: memory,
  /**
   * 适用于浏览器的sessionStorage存储引擎
   */
  sessionStorage: session,
} as const;
