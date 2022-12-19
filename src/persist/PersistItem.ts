import type { StorageEngine } from '../engines';
import type { InternalModel, Model, ModelPersist } from '../model/types';
import { isObject, isString } from '../utils/isType';
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
   * 存储时间
   */
  t: number;
  /**
   * 数据
   */
  d: string;
}

export interface PersistOptions {
  /**
   * 每个模型的最大持久化时间，默认：Infinity。
   */
  maxAge?: number;
  /**
   * 存储唯一标识名称
   */
  key: string;
  /**
   * 存储名称前缀，默认值：@@foca.persist:
   */
  keyPrefix?: string;
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

type CustomModelPersistOptions = Required<ModelPersist<object>>;

const defaultDecodeFn = (value: any) => value;

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
      maxAge = Infinity,
    } = options;

    this.key = keyPrefix + key;

    for (let i = models.length; i-- > 0; ) {
      const model = models[i]!;
      const {
        decode = defaultDecodeFn,
        maxAge: customMaxAge = maxAge,
        version: customVersion = 0,
      } = (model as unknown as InternalModel)._$opts.persist || {};

      this.records[model.name] = {
        model,
        opts: {
          version: customVersion,
          maxAge: customMaxAge,
          decode,
        },
      };
    }
  }

  init(): Promise<void> {
    return this.options.engine.getItem(this.key).then((data) => {
      if (!data) {
        return this.dump();
      }

      try {
        const schema = JSON.parse(data);

        if (!this.validateSchema(schema)) {
          return this.dump();
        }

        let changed: boolean = false;
        const schemaKeys = Object.keys(schema.d);
        for (let i = schemaKeys.length; i-- > 0; ) {
          const key = schemaKeys[i]!;
          const record = this.records[key];

          if (record) {
            const itemSchema = schema.d[key]!;

            if (this.validateItemSchema(itemSchema, record.opts)) {
              const state: object = parseState(itemSchema.d);
              const decodedState = record.opts.decode.call(null, state);
              record.schema = itemSchema;
              record.prev = decodedState === void 0 ? state : decodedState;
            } else {
              changed ||= true;
            }
          } else {
            changed ||= true;
          }
        }

        changed && this.dump();
        return;
      } catch {
        this.dump();
        throw new Error('[persist] 无法解析持久化数据，已重置');
      }
    });
  }

  collect(): Record<string, object> {
    const stateMaps: Record<string, object> = {};

    this.loop(({ prev: state }, key) => {
      state && (stateMaps[key] = state);
    });

    return stateMaps;
  }

  update(nextState: Record<string, object>) {
    const now = Date.now();
    let changed = false;

    this.loop((record) => {
      const { model, prev, opts, schema } = record;
      const nextStateForKey = nextState[model.name];

      // 状态不变的情况下，即使过期了也无所谓，下次初始化时会自动剔除。
      // 版本号改动的话一定会触发页面刷新。
      if (nextStateForKey !== prev) {
        record.prev = nextStateForKey;
        const nextSchema = {
          t: now,
          v: opts.version,
          d: stringifyState(nextStateForKey),
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
    return (
      schema &&
      schema.v === options.version &&
      isString(schema.d) &&
      schema.t + options.maxAge >= Date.now()
    );
  }

  protected toJSON(): PersistSchema {
    const states: PersistSchema['d'] = {};

    this.loop(({ schema }, key) => {
      schema && (states[key] = schema);
    });

    return { v: this.options.version, d: states };
  }
}
