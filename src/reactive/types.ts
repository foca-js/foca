export interface Deps {
  id: string;
  end(): void;
  isDirty(): boolean;
}

export interface ComputedRef<T = any> {
  readonly value: T;
}
