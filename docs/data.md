#

# name

模型的名称，通过`model.name`获取。

# state

模型的实时状态，通过`model.state`获取。你可以在任何地方使用，没有限制。但如果你想在组件里动态更新数据，就得配合 hooks 和 connect 了。

# loading

模型异步函数的当前状态，通过`getLoading(effect)`获取。

# meta

模型异步函数的**当前**状态，通过`getMeta(effect)`获取。

本质上，loading 派生自 meta，meta 总是存储了异步函数的一些执行信息，比如是否正在执行，比如执行异常时的 message。
<br/>
可通过[进阶篇](/advanced?id=meta)学习如何扩展 meta。

```typescript
/**
 * {
 *   type?: 'pending' | 'resolved' | 'rejected';
 *   message?: string;
 * }
 */
const meta = getMeta(userModel.fetchUser);
```

!> meta 和 loading 采用懒加载机制，不用则不记录，不存在性能问题。
