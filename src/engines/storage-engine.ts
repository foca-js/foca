export interface StorageEngine {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): any;
  removeItem(key: string): any;
  clear(): any;
}
