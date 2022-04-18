export interface Deps {
  tagName: string;
  end(): void;
  isDirty(): boolean;
  cloneAndCollect(): Deps;
}

export interface ComputedRef<T = any> {
  readonly value: T;
}
