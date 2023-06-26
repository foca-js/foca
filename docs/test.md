前端的需求变化总是太快导致测试用例跟不上，甚至部分程序员根本就没想过为自己写的代码编写测试，他们心里总是想着`出错了再说`。对于要求拥有高质量体验的项目，测试是必不可少的，它能使得代码更加稳健，并且在新增功能和重构代码时，都无需太担心会破坏原有的逻辑。在多人协作的项目中，充足的测试可以让其他人员对相应的逻辑有更充分的了解。

## 测试框架

- [Vitest](https://cn.vitest.dev/)
- [Jest](https://jestjs.io/zh-Hans/)
- [Mocha](https://mochajs.org/)
- [node:test](https://nodejs.org/dist/latest-v18.x/docs/api/test.html#test-runner) node@18.8.0开始提供

## 准备工作

我们已经知道，foca 是基于 redux 存储数据的，所以在测试模型之前，需要先激活 store，并且在测试完毕后销毁以免影响其他测试。

```typescript
// test/model.test.ts
import { store } from 'foca';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});
```

## 单元测试

我们假设你已经写好了一个模型

```typescript
// src/models/my-custom.model.ts
import { defineModel } from 'foca';

export const myCustomModel = defineModel('my-model', {
  initialState: { count: 0 },
  reducers: {
    plus(state, step: number = 1) {
      state.count += step;
    },
    minus(state, step: number = 1) {
      state.count -= step;
    },
  },
});
```

对，它现在很简洁，但是已经满足测试条件了

```typescript
// test/model.test.ts
import { store } from 'foca';
import { myCustomModel } from '../src/models/my-custom.model.ts';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('initial state', () => {
  expect(myCustomModel.state.count).toBe(0);
});

test('myCustomModel.plus', () => {
  myCustomModel.plus();
  expect(myCustomModel.state.count).toBe(1);
  myCustomModel.plus(5);
  expect(myCustomModel.state.count).toBe(6);
  myCustomModel.plus(100);
  expect(myCustomModel.state.count).toBe(106);
});

test('myCustomModel.minus', () => {
  myCustomModel.minus();
  expect(myCustomModel.state.count).toBe(-1);
  myCustomModel.minus(10);
  expect(myCustomModel.state.count).toBe(-11);
  myCustomModel.minus(28);
  expect(myCustomModel.state.count).toBe(-39);
});
```

**只测试**业务上的那部分逻辑，每处逻辑分开测试，这就是 `Unit Test` 和你该做的。

## 覆盖率

对于大一些的项目，你很难保证所有逻辑都已经写进了测试，则建议打开测试框架的覆盖率功能并检查每一行的覆盖情况。一般情况下，覆盖率的报告会放到`coverage`目录，你只需要在浏览器中打开`coverage/index.html`就可以查看了。
