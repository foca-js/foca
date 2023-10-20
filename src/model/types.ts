import type { AnyAction } from 'redux';
import type { EnhancedEffect } from './enhance-effect';
import type { PersistMergeMode } from '../persist/persist-item';

export interface ComputedFlag {
  readonly _computedFlag: never;
}

export interface GetName<Name extends string> {
  /**
   * 模型名称。请在定义模型时确保是唯一的字符串
   */
  readonly name: Name;
}

export interface GetState<State extends object> {
  /**
   * 模型的实时状态
   */
  readonly state: State;
}

export interface GetInitialState<State extends object> {
  /**
   * 模型的初始状态，每次获取该属性都会执行深拷贝操作
   */
  readonly initialState: State;
}

export type ModelPersist<State extends object, PersistDump> = {
  /**
   * 持久化版本号，数据结构变化后建议立即升级该版本。默认值：`0`
   */
  version?: number | string;

  /**
   * 持久化数据与初始数据的合并方式。默认值以全局配置为准
   *
   * - replace - 覆盖模式。直接用持久化数据替换初始数据
   * - merge - 合并模式。持久化数据与初始数据新增的key进行合并，可理解为`Object.assign`
   * - deep-merge - 二级合并模式。在合并模式的基础上，如果某个key的值为对象，则该对象也会执行合并操作
   *
   * 注意：当数据为数组格式时该配置无效。
   * @since 3.0.0
   */
  merge?: PersistMergeMode;
} & (
  | {
      /**
       * 模型数据从内存存储到持久化引擎时的过滤函数，允许你只持久化部分数据。
       * ```typescript
       *
       * // state = { firstName: 'tick', lastName: 'tock' }
       * dump: (state) => state
       * dump: (state) => state.firstName
       * dump: (state) => ({ name: state.lastName })
       * ```
       *
       * @since 3.0.0
       */
      dump: (state: State) => PersistDump;
      /**
       * 持久化数据恢复到模型内存时的过滤函数，参数为`dump`返回的值。
       * ```typescript
       * // state = { firstName: 'tick', lastName: 'tock' }
       * {
       *   dump(state) {
       *     return state.firstName
       *   },
       *   load(firstName) {
       *     return { ...this.initialState, firstName: firstName };
       *   }
       * }
       * ```
       *
       * @since 3.0.0
       */
      load: (this: GetInitialState<State>, dumpData: PersistDump) => State;
    }
  | {
      dump?: never;
      load?: never;
    }
);

export interface ActionCtx<State extends object>
  extends GetName<string>,
    GetInitialState<State> {}

export interface EffectCtx<State extends object>
  extends ActionCtx<State>,
    GetState<State> {
  /**
   * 立即更改状态，支持**immer**操作
   *
   * ```typescript
   * this.setState((state) => {
   *   state.count += 1;
   * });
   * ```
   *
   * 对于object类型，你可以直接传递 **全部** 或者 **部分** 数据
   * ```typescript
   * interface State { id: number; name: string };
   *
   * this.setState({}); // 什么也没修改
   * this.setState({ id: 10 }); // 只修改id
   * this.setState({ id: 10, name: 'foo' }); // 修改全部
   *
   * this.setState((state) => {
   *   return {}; // 什么也没修改
   * });
   * this.setState((state) => {
   *   return { id: 10 }; // 只修改id
   * });
   * this.setState((state) => {
   *   return { id: 10, name: 'foo' }; // 修改全部
   * });
   * ```
   *
   * 对于array类型，直接传递数组就行了
   * ```typescript
   * this.setState(['a', 'b', 'c']);
   * ```
   */
  readonly setState: State extends any[]
    ? (state: State | ((state: State) => State | void)) => AnyAction
    : <K extends keyof State>(
        state: SetStateCallback<State, K> | (Pick<State, K> | State),
      ) => AnyAction;
}

export interface SetStateCallback<State extends object, K extends keyof State> {
  (state: State): Pick<State, K> | State | void;
}

export interface ComputedCtx<State extends object>
  extends GetName<string>,
    GetState<State> {}

export interface BaseModel<Name extends string, State extends object>
  extends GetState<State>,
    GetName<Name> {}

type ModelActionItem<
  State extends object,
  Action extends object,
  K extends keyof Action,
> = Action[K] extends (state: State, ...args: infer P) => State | void
  ? (...args: P) => AnyAction
  : never;

type ModelAction<State extends object, Action extends object> = {
  readonly [K in keyof Action]: ModelActionItem<State, Action, K>;
};

type GetPrivateMethodKeys<Method extends object> = {
  [K in keyof Method]: K extends `_${string}` ? K : never;
}[keyof Method];

type ModelEffect<Effect extends object> = {
  readonly [K in keyof Effect]: Effect[K] extends (...args: infer P) => infer R
    ? EnhancedEffect<P, R>
    : never;
};

type ModelComputed<Computed extends object> = {
  readonly [K in keyof Computed]: Computed[K] & ComputedFlag;
};

export type Model<
  Name extends string = string,
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
  Computed extends object = object,
> = BaseModel<Name, State> &
  // [K in keyof Action as K extends `_${string}` ? never : K]
  // 上面这种看起来简洁，业务代码提示也正常，但是业务代码那边无法点击跳转进模型了。
  // 所以需要先转换所有的属性，再把私有属性去除。
  Omit<ModelAction<State, Action>, GetPrivateMethodKeys<Action>> &
  Omit<ModelEffect<Effect>, GetPrivateMethodKeys<Effect>> &
  Omit<ModelComputed<Computed>, GetPrivateMethodKeys<Computed>>;

export type InternalModel<
  Name extends string = string,
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
  Computed extends object = object,
> = BaseModel<Name, State> & {
  readonly _$opts: DefineModelOptions<State, Action, Effect, Computed, any>;
  readonly _$persistCtx: GetInitialState<State>;
};

export type InternalAction<State extends object> = {
  [key: string]: (state: State, ...args: any[]) => State | void;
};

export interface Event<State> {
  /**
   * store初始化完成，并且持久化（如果有）的数据也已经恢复。
   *
   * 上下文 **this** 可以直接调用actions和effects的函数以及computed计算属性。
   */
  onInit?: () => void;
  /**
   * 每当state有变化时的回调通知。
   *
   * 初始化(onInit)执行之前不会触发该回调。如果在onInit中做了修改state的操作，则会触发该回调。
   *
   * 上下文 **this** 可以直接调用actions和effects的函数以及computed计算属性，请谨慎执行修改数据的操作以防止死循环。
   */
  onChange?: (prevState: State, nextState: State) => void;
  /**
   * 销毁模型时的回调通知，此时模型已经被销毁。
   * 该事件仅在局部模型生效
   * @see useIsolate
   */
  onDestroy?: (this: never, modelName: string) => void;
}

export interface EventCtx<State extends object>
  extends GetName<string>,
    GetState<State> {}

export interface DefineModelOptions<
  State extends object,
  Action extends object,
  Effect extends object,
  Computed extends object,
  PersistDump,
> {
  /**
   * 初始状态
   *
   * ```typescript
   * cosnt initialState: {
   *   count: number;
   * } = {
   *   count: 0,
   * }
   *
   * const model = defineModel('model1', {
   *   initialState
   * });
   * ```
   */
  initialState: State;
  /**
   * 定义修改状态的方法。参数一自动推断为state类型。支持**immer**操作。支持多参数。
   *
   * ```typescript
   * const model = defineModel('model1', {
   *   initialState,
   *   reducers: {
   *     plus(state, step: number) {
   *       state.count += step;
   *     },
   *     minus(state, step: number, scale: 1 | 2) {
   *       state.count -= step * scale;
   *     }
   *   },
   * });
   * ```
   */
  reducers?: Action & InternalAction<State> & ThisType<ActionCtx<State>>;
  /**
   * 定义普通方法，异步方法等。
   * 调用effect方法时，一般会伴随异步操作（请求数据、耗时任务），框架会自动收集当前方法的调用状态。
   *
   * ```typescript
   * const model = defineModel('model1', {
   *   initialState,
   *   methods: {
   *     async foo(p1: string, p2: number) {
   *       const result = await Promise.resolve();
   *       this.setState({ x: result });
   *       return 'OK';
   *     }
   *   },
   * });
   *
   * useLoading(model.foo); // 返回值类型: boolean
   * ```
   */
  methods?: Effect &
    ThisType<ModelAction<State, Action> & Effect & Computed & EffectCtx<State>>;
  /**
   * 定义计算属性。针对需要复杂的计算才能得出结果的场景而设计。如果只是简单的返回，建议使用`methods`
   *
   * ```typescript
   * const initialState = { firstName: 'tick', lastName: 'tock' };
   *
   * const model = defineModel('model1', {
   *   initialState,
   *   computed: {
   *     fullname() {
   *       return this.state.firstName + '.' + this.state.lastName;
   *     },
   *     names() {
   *       return this.fullName.value.split('').map((item) => `[${item}]`);
   *     }
   *   },
   * });
   * ```
   *
   * 可以单独使用：
   * ```typescript
   * model.fullname; // ComputedRef<string>;
   * model.fullname.value; // string;
   * ```
   *
   * 可以配合react hooks使用：
   *
   * ```typescript
   * const fullname = useComputed(model.fullname); // string
   * ```
   */
  computed?: Computed & ThisType<Computed & ComputedCtx<State>>;
  /**
   * 是否阻止刷新数据时跳过当前模型，默认即不跳过。
   *
   * 如果是强制刷新，则该参数无效。
   *
   * @see store.refresh(force: boolean = false)
   */
  skipRefresh?: boolean;
  /**
   * 定制持久化，请确保已经在初始化store的时候把当前模型加入persist配置，否则当前设置无效
   *
   * @see store.init()
   */
  persist?: ModelPersist<State, PersistDump> & ThisType<null>;
  /**
   * 生命周期
   * @since 0.11.1
   */
  events?: Event<State> &
    ThisType<ModelAction<State, Action> & Computed & Effect & EventCtx<State>>;
}
