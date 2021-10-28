export interface StorageEngine {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<any>;
  removeItem(key: string): Promise<any>;
  clear?(): Promise<any>;
}
