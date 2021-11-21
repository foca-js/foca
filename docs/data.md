#

# name

模型的名称，通过`model.name`获取。

# state

模型的实时状态，通过`model.state`获取。你可以在任何地方使用，没有限制。但如果你想在组件里动态更新数据，就得配合 hooks 和 connect 了。

# loading

模型异步函数的当前状态，通过`getLoading(model.effectX)`获取。

# meta

模型异步函数的**当前**状态，通过`getMeta(model.effectX)`获取。

本质上，loading 派生自 meta，meta 总是存储了异步函数的一些执行信息，比如是否正在执行，比如执行异常时的 message。

```typescript
/**
 * {
 *   type?: 'pending' | 'resolved' | 'rejected';
 *   message?: string;
 * }
 */
const meta = getMeta(userModel.fetchUser);
```

# meta plus

foca 自带的 meta 属性屈指可数，你决定扩展一些自己的业务属性。

```json5
// File: tsconfig.json
{
  compilerOptions: {
    typeRoots: ['node_modules/@types/', './typings'],
  },
}
```

```typescript
// File: typings/foca/index.d.ts
export * from 'foca';

declare module 'foca' {
  // 扩展meta的属性
  export interface Meta {
    status?: number;
    code?: string;
  }
}
```

扩展的好处就是可以满足更多的业务需求，因为单靠 message 无法存储更多的异常信息。

```typescript
import { EffectError } from 'foca';
import axios from 'axios';

const userModel = defineModel('users', {
  initialState,
  effects: {
    async get() {
      try {
        const result = await http.get('/users');
      } catch (e) {
        if (e.response) {
          throw new EffectError({
            message: e.message,
            status: e.response.status,
            code: e.response.data.code,
          });
        }

        throw e;
      }
    },
  },
});
```

foca 会检测抛出的异常是否为`EffectError`，这也是增强 meta 的唯一方式。
