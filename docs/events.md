每个模型都有针对自身的事件回调，在某些复杂的业务场景下，事件和其它属性的组合将变得十分灵活。

## onInit

当 store 初始化完成 并且持久化（如果有）数据已经恢复时，onInit 就会被自动触发。你可以调用 methods 或者 reducers 做一些额外操作。

```typescript
import { defineModel } from 'foca';

// 如果是持久化的模型，则初始值不一定是0
const initialState = { count: 0 };

export const myModel = defineModel('my', {
  initialState,
  reducers: {
    add(state, step: number) {
      state.count += step;
    },
  },
  methods: {
    async requestApi() {
      const result = await http.get('/path/to');
      // ...
    },
  },
  events: {
    onInit() {
      this.add(10);
      this.requestApi();
    },
  },
});
```

## onChange

每当 state 有变化时的回调通知。初始化(onInit)执行之前不会触发该回调。如果在 onInit 中做了修改 state 的操作，则会触发该回调。

```typescript
import { defineModel } from 'foca';

const initialState = { count: 0 };

export const testModel = defineModel('test', {
  initialState,
  reducers: {
    add(state, step: number) {
      state.count += step;
    },
  },
  methods: {
    _notify() {
      // do something
    },
  },
  events: {
    onChange(prevState, nextState) {
      if (prevState.count !== nextState.count) {
        // 达到watch的效果
        this._notify();
      }
    },
  },
});
```
