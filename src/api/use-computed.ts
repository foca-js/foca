import { ComputedFlag } from '../model/types';
import { useModelSelector } from '../redux/use-selector';
import { toArgs } from '../utils/to-args';

export interface UseComputedFlag extends ComputedFlag {
  (...args: any[]): any;
}

/**
 * 计算属性hooks函数，第二个参数开始传入计算属性的参数（如果有）
 *
 * ```typescript
 *
 * const App: FC = () => {
 *   const fullName = useComputed(model.fullName);
 *   const profile = useComputed(model.profile, 25);
 *   return <p>{profile}</p>;
 * }
 *
 * const model = defineModel('my-model', {
 *   initialState: { firstName: '', lastName: '' },
 *   computed: {
 *     fullName() {
 *       return this.state.firstName + this.state.lastName;
 *     },
 *     profile(age: number, address?: string) {
 *       return this.fullName() + age + address;
 *     }
 *   }
 * });
 *
 * ```
 */
export function useComputed<T extends UseComputedFlag>(
  ref: T,
  ...args: Parameters<T>
): T extends (...args: any[]) => infer R ? R : never;

export function useComputed(ref: UseComputedFlag) {
  const args = toArgs(arguments, 1);
  return useModelSelector(() => ref.apply(null, args));
}
