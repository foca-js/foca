#

# onInit

当 store 初始化完成 并且持久化（如果有）数据已经恢复时，onInit 就会被自动触发。你可以调用 effects 或者 actions 做一些额外操作。

```typescript
import { defineModel } from 'foca';

// 如果是持久化的模型，则初始值不一定是0
const initialState = { count: 0 };

export const myModel = defineModel('my', {
  initialState,
  actions: {
    add(state, step: number) {
      state.count += step;
    },
  },
  effects: {
    async requestApi() {
      const result = await http.get('/path/to');
      // ...
    },
  },
  hooks: {
    onInit() {
      this.add(10);
      this.requestApi();
    },
  },
});
```

# onChange

每当 state 有变化时的回调通知。初始化(onInit)执行之前不会触发该回调。如果在 onInit 中做了修改 state 的操作，则会触发该回调。

```typescript
import { defineModel } from 'foca';

const initialState = { count: 0 };

export const myModel = defineModel('my', {
  initialState,
  actions: {
    add(state, step: number) {
      state.count += step;
    },
  },
  hooks: {
    onChange(prevState, nextState) {
      if (nextState.count < 10) {
        // 必须在满足某种条件下才能再次修改，否则进入死循环
        this.add(1);
      }
    },
  },
});
```
