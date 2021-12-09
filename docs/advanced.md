#

# meta+

foca 自带的 meta 属性屈指可数，你需要根据业务扩展一些独有的属性。

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
        // 如果是axios请求库，则可以在拦截器中统一处理异常
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

# 克隆模型

虽然比较不常用，但有时候为了同一个页面的不同模块能独立使用模型数据，你就得需要复制这个模型，并把名字改掉。其实也不用这么麻烦，foca 给你来个惊喜：

```typescript
import { defineModel, cloneModel } from 'foca';

// 你打算用在各个普通页面里。
cosnt userModel = defineModel('users', { ... });

// 你打算用在通用的用户列表弹窗里。
const user1Model = cloneModel('users1', userModel);
// 你打算用在页头或页脚模块里。
const user2Model = cloneModel('users2', userModel);
```

共享方法但状态是独立的，这是个不错的主意，你只要维护一份代码就行了。

# 执行状态隔离

默认地，effect 函数只会保存一份执行状态，如果你在同一时间多次执行同一个函数，那么状态就会互相覆盖，产生错乱的数据。如果现在有 10 个按钮，点击每个按钮都会执行`model.effectX(id)`，那么我们如何知道是哪个按钮执行的呢？这时候我们需要为执行状态开辟一个独立的存储空间，让同一个函数是拥有多个状态互不干扰。

```tsx
import { useLoading } from 'foca';

const App: FC = () => {
  const loadings = useLoading(model.myMethod.assign);

  const handleClick = (id: number) => {
    model.myMethod.assign(id).execute(id);
  };

  return (
    <div>
      <button onClick={() => handleClick(1)}>
        A {loadings.find(1) ? 'Loading...' : ''}
      </button>
      <button onClick={() => handleClick(2)}>
        B {loadings.find(2) ? 'Loading...' : ''}
      </button>
      <button onClick={() => handleClick(3)}>
        C {loadings.find(3) ? 'Loading...' : ''}
      </button>
    </div>
  );
};
```

这种场景也常出现在一些表格里，每一行通常都带有切换（switch UI）控件，点击后该控件需要被禁用或者出现 loading 图标，提前是你得知道是谁。

如果你能确定 find 的参数，那么也可以直接传递：

```typescript
const loading = useLoading(model.myMethod.assign, 100); // boolean

// 等效于
const loading = useLoading(model.myMethod.assign).find(100);
```

# 同步函数

没有人规定 effects 里的方法就必须是异步的，你可以随意写，只要是函数就行了。比如有时候一个模型里重复代码太多，提取通用的部分代码到 effects 里就很合适。或者组件里经常需要大量操作才能获得 state 里的一个数据，那么也建议放到 effects 里节省工作量。

```typescript
export const userModel = defineModel('users', {
  initialState,
  effects: {
    getUsersAmount() {
      return this.state.length;
    },
    getOther() {
      return {
        amount: this.getUsersAmount(),
        other: 'xyz',
      };
    },
  },
});

// const count = userModel.getUsersAmount();
```

# 同类状态库共存

如果你的项目已经存在一个`redux系`的状态库，不方便改动，但又想用 foca 状态库。这确实很苦恼，改动就代码怕出 bug，不改又要继续煎熬。

所幸 foca 支持共存方案，只需简单步骤：

1. 正常初始化
2. 检查项目中是否用到 connect() 高阶组件，如果有，则执行下面逻辑：

```typescript
import { store, combine } from 'foca';
import { createStore } from 'my-package';

// 你原来的store
const legacyStore = createStore(...);

store.init(...);
// 绑定原来的store以驱动 connect()
combine(legacyStore);
```

共存后，你就可以慢慢地把旧的 reducer 迁移到 foca 了。（反过来操作也行！）
