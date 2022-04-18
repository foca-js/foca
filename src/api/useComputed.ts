import { ComputedRef } from '../computed/types';
import { useModelSelector } from '../redux/useSelector';

export const useComputed = <T>(ref: ComputedRef<T>): T => {
  return useModelSelector(() => ref.value);
};
