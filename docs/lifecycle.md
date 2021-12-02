#

# onReady

当 store 初始化完成 并且持久化（如果有）数据已经恢复时，onReady 就会被自动触发，你可以调用 effects 或者 actions 做一些额外操作。

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
    onReady() {
      this.add(10);
      this.requestApi();
    },
  },
});
```
