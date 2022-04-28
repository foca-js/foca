import { ComputedRef } from '../reactive/types';
import { useModelSelector } from '../redux/useSelector';

export const useComputed = <T>(ref: ComputedRef<T>): T => {
  return useModelSelector(() => ref.value);
};
