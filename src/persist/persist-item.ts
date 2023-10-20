import type { StorageEngine } from '../engines/storage-engine';
import type {
  GetInitialState,
  InternalModel,
  Model,
  ModelPersist,
} from '../model/types';
import { isObject, isPlainObject, isString } from '../utils/is-type';
import { toPromise } from '../utils/to-promise';
import { parseState, stringifyState } from '../utils/serialize';

export interface PersistSchema {
  /**
   * 版本
   */
  v: number | string;
  /**
   * 数据
   */
  d: {
    [key: string]: PersistItemSchema;
  };
}

export interface PersistItemSchema {
  /**
   * 版本
   */
  v: number | string;
  /**
   * 数据
   */
  d: string;
}

export type PersistMergeMode = 'replace' | 'merge' | 'deep-merge';

export interface PersistOptions {
  /**
   * 存储唯一标识名称
   */
  key: string;
  /**
   * 存储名称前缀，默认值：`@@foca.persist:`
   */
  keyPrefix?: string;
  /**
   * 持久化数据与初始数据的合并方式。默认值：`merge`
   *
   * - replace - 覆盖模式。数据从存储引擎取出后直接覆盖初始数据
   * - merge - 合并模式。数据从存储引擎取出后，与初始数据多余部分进行合并，可以理解为`Object.assign()`操作
   * - deep-merge - 二级合并模式。在合并模式的基础上，如果某个key的值为对象，则该对象也会执行合并操作
   *
   * 注意：当数据为数组格式时该配置无效。
   * @since 3.0.0
   */
  merge?: PersistMergeMode;
  /**
   * 版本号
   */
  version: string | number;
  /**
   * 存储引擎
   */
  engine: StorageEngine;
  /**
   * 允许持久化的模型列表
   */
  models: Model[];
}

type CustomModelPersistOptions = Required<ModelPersist<object, any>> & {
  ctx: GetInitialState<object>;
};

const defaultDumpOrLoadFn = (value: any) => value;

interface PersistRecord {
  model: Model;
  /**
   * 模型的persist参数
   */
  opts: CustomModelPersistOptions;
  /**
   * 已经存储的模型内容，data是字符串。
   * 存储时，如果各项属性符合条件，则会当作最终值，从而省去了系列化的过程。
   */
  schema?: PersistItemSchema;
  /**
   * 已经存储的模型内容，data是对象。
   * 主要用于和store变化后的state对比。
   */
  prev?: object;
}

export class PersistItem {
  readonly key: string;

  protected readonly records: Record<string, PersistRecord> = {};

  constructor(protected readonly options: PersistOptions) {
    const {
      models,
      keyPrefix = '@@foca.persist:',
      key,
      merge = 'merge' satisfies PersistMergeMode,
    } = options;

    this.key = keyPrefix + key;

    for (let i = models.length; i-- > 0; ) {
      const model = models[i]!;
      const {
        load = defaultDumpOrLoadFn,
        dump = defaultDumpOrLoadFn,
        version: customVersion = 0,
        merge: customMerge = merge,
      } = (model as unknown as InternalModel)._$opts.persist || {};

      this.records[model.name] = {
        model,
        opts: {
          version: customVersion,
          merge: customMerge,
          load,
          dump,
          ctx: (model as unknown as InternalModel)._$persistCtx,
        },
      };
    }
  }

  init(): Promise<void> {
    return toPromise(() => this.options.engine.getItem(this.key)).then(
      (data) => {
        if (!data) {
          this.loadMissingState();
          return this.dump();
        }

        try {
          const schema = JSON.parse(data);

          if (!this.validateSchema(schema)) {
            this.loadMissingState();
            return this.dump();
          }

          const schemaKeys = Object.keys(schema.d);
          for (let i = schemaKeys.length; i-- > 0; ) {
            const key = schemaKeys[i]!;
            const record = this.records[key];

            if (record) {
              const { opts } = record;
              const itemSchema = schema.d[key]!;
              if (this.validateItemSchema(itemSchema, opts)) {
                const dumpData = parseState(itemSchema.d);
                record.prev = this.merge(
                  opts.load.call(opts.ctx, dumpData),
                  opts.ctx.initialState,
                  opts.merge,
                );
                record.schema = itemSchema;
              }
            }
          }

          this.loadMissingState();
          return this.dump();
        } catch (e) {
          this.dump();
          throw e;
        }
      },
    );
  }

  loadMissingState() {
    this.loop((record) => {
      const { prev, opts, schema } = record;
      if (!schema || !prev) {
        const dumpData = opts.dump.call(null, opts.ctx.initialState);
        record.prev = this.merge(
          opts.load.call(opts.ctx, dumpData),
          opts.ctx.initialState,
          opts.merge,
        );
        record.schema = {
          v: opts.version,
          d: stringifyState(dumpData),
        };
      }
    });
  }

  merge(persistState: any, initialState: any, mode: PersistMergeMode) {
    const isStateArray = Array.isArray(persistState);
    const isInitialStateArray = Array.isArray(initialState);
    if (isStateArray && isInitialStateArray) return persistState;
    if (isStateArray || isInitialStateArray) return initialState;

    if (mode === 'replace') return persistState;

    const state = Object.assign({}, initialState, persistState);

    if (mode === 'deep-merge') {
      const keys = Object.keys(persistState);
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i]!;
        if (
          Object.prototype.hasOwnProperty.call(initialState, key) &&
          isPlainObject(state[key]) &&
          isPlainObject(initialState[key])
        ) {
          state[key] = Object.assign({}, initialState[key], state[key]);
        }
      }
    }

    return state;
  }

  collect(): Record<string, object> {
    const stateMaps: Record<string, object> = {};

    this.loop(({ prev: state }, key) => {
      state && (stateMaps[key] = state);
    });

    return stateMaps;
  }

  update(nextState: Record<string, object>) {
    let changed = false;

    this.loop((record) => {
      const { model, prev, opts, schema } = record;
      const nextStateForKey = nextState[model.name]!;

      // 状态不变的情况下，即使过期了也无所谓，下次初始化时会自动剔除。
      // 版本号改动的话一定会触发页面刷新。
      if (nextStateForKey !== prev) {
        record.prev = nextStateForKey;
        const nextSchema: PersistItemSchema = {
          v: opts.version,
          d: stringifyState(opts.dump.call(null, nextStateForKey)),
        };

        if (!schema || nextSchema.d !== schema.d) {
          record.schema = nextSchema;
          changed ||= true;
        }
      }
    });

    changed && this.dump();
  }

  protected loop(callback: (record: PersistRecord, key: string) => void) {
    const records = this.records;
    const recordKeys = Object.keys(records);
    for (let i = recordKeys.length; i-- > 0; ) {
      const key = recordKeys[i]!;
      callback(records[key]!, key);
    }
  }

  protected dump() {
    this.options.engine.setItem(this.key, JSON.stringify(this.toJSON()));
  }

  protected validateSchema(schema: any): schema is PersistSchema {
    return (
      isObject<PersistSchema>(schema) &&
      isObject<PersistSchema['d']>(schema.d) &&
      schema.v === this.options.version
    );
  }

  protected validateItemSchema(
    schema: PersistItemSchema | undefined,
    options: CustomModelPersistOptions,
  ) {
    return schema && schema.v === options.version && isString(schema.d);
  }

  protected toJSON(): PersistSchema {
    const states: PersistSchema['d'] = {};

    this.loop(({ schema }, key) => {
      schema && (states[key] = schema);
    });

    return { v: this.options.version, d: states };
  }
}
