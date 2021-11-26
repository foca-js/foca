import type { StorageEngine } from '../engines';
import type { InternalModel, Model, ModelPersist } from '../model/defineModel';
import { parsePersist, stringifyPersist } from '../utils/json';

export interface PersistSchema {
  /**
   * 版本
   */
  v: number | string;
  /**
   * 数据
   */
  d: {
    [key: string]: PersistSerialized;
  };
}

export interface PersistSerialized {
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

type CustomModelPersist = Required<ModelPersist<object>>;

const noop = (value: any) => value;

export class PersistItem {
  readonly key: string;

  protected readonly records: Record<
    string,
    {
      model: Model;
      /**
       * 模型的persist参数
       */
      persist: CustomModelPersist;
      /**
       * 已经存储的模型内容，data是字符串。
       * 存储时，如果各项属性符合条件，则会当作最终值，从而省去了系列化的过程。
       */
      serialized?: PersistSerialized;
      /**
       * 已经存储的模型内容，data是对象。
       * 主要用于和store变化后的state对比。
       */
      decodeState?: object;
    }
  > = {};

  constructor(protected readonly options: PersistOptions) {
    this.key = (options.keyPrefix || '@@foca.persist:') + options.key;

    options.models.forEach((model) => {
      const persist = (model as unknown as InternalModel)._$opts.persist || {};

      this.records[model.name] = {
        model,
        persist: {
          version: persist.version !== void 0 ? persist.version : 0,
          maxAge:
            persist.maxAge !== void 0
              ? persist.maxAge
              : options.maxAge !== void 0
              ? options.maxAge
              : Infinity,
          decode: persist.decode || noop,
        },
      };
    });
  }

  init() {
    return this.options.engine.getItem(this.key).then((data) => {
      if (!data) {
        return void this.dump();
      }

      try {
        const schema = JSON.parse(data) as PersistSchema;

        if (!this.validateSchema(schema)) {
          return void this.dump();
        }

        let changed: boolean = false;

        Object.keys(schema.d).forEach((key) => {
          const serialized = schema.d[key]!;
          const record = this.records[key];

          if (record) {
            if (this.validateSerialized(serialized, record.persist)) {
              const state = parsePersist(serialized.d) as object;

              record.serialized = serialized;
              record.decodeState = record.persist.decode(state) || state;
            } else {
              changed ||= true;
            }
          } else {
            changed ||= true;
          }
        });

        changed && this.dump();
      } catch {
        this.dump();
        console.error('Unable to parse persist data from storage');
      }

      return;
    });
  }

  collect(): Record<string, object> {
    const stateMaps: Record<string, object> = {};

    Object.keys(this.records).forEach((key) => {
      const state = this.records[key]!.decodeState;
      state && (stateMaps[key] = state);
    });

    return stateMaps;
  }

  update(nextState: Record<string, object>) {
    let changed: boolean = false;

    Object.keys(this.records).forEach((key) => {
      const record = this.records[key]!;
      const nextStateForKey = nextState[record.model.name];
      const { version, maxAge } = record.persist;
      const now = Date.now();
      const optionChanged =
        !record.serialized ||
        version !== record.serialized.v ||
        record.serialized.t + maxAge < now;

      if (
        optionChanged ||
        !record.decodeState ||
        nextStateForKey !== record.decodeState
      ) {
        const serialized: PersistSerialized = {
          t: now,
          v: version,
          d: stringifyPersist(nextStateForKey),
        };

        if (optionChanged || serialized.d !== record.serialized!.d) {
          record.serialized = serialized;
          changed ||= true;
        }

        record.decodeState = nextStateForKey;
      }
    });

    changed && this.dump();
  }

  protected dump() {
    const schema = JSON.stringify(this.toJSON());
    this.options.engine.setItem(this.key, schema);
  }

  protected validateSchema(schema: PersistSchema) {
    return (
      schema &&
      typeof schema === 'object' &&
      schema.d &&
      typeof schema.d === 'object' &&
      schema.v === this.options.version
    );
  }

  protected validateSerialized(
    serialized: PersistSerialized,
    modelPersist: CustomModelPersist,
  ) {
    return (
      serialized.v === modelPersist.version &&
      typeof serialized.d === 'string' &&
      serialized.t + modelPersist.maxAge >= Date.now()
    );
  }

  protected toJSON(): PersistSchema {
    const states: PersistSchema['d'] = {};

    Object.keys(this.records).forEach((key) => {
      const serialized = this.records[key]!.serialized;
      serialized && (states[key] = serialized);
    });

    return { v: this.options.version, d: states };
  }
}
