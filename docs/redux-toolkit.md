<table>
<thead>
<tr>
<th>foca</th>
<th>toolkit</th>
</tr>
</thead>
<tbody>
<tr>
<th colspan="2">
开源时间
</th>
</tr>
<tr>
<td>2021-10</td>
<td>2018-03</td>
</tr>
<tr>
<th colspan="2">
文档地址
</th>
</tr>
<tr>
<td valign="top">

[foca.js.org](https://foca.js.org)（中文文档）

</td>
<td>

[redux-toolkit.js.org](https://redux-toolkit.js.org/)（English documentation）

</td>
</tr>
<tr>
<th colspan="2">
安装
</th>
</tr>
<tr>
<td  valign="top">

```bash
pnpm add foca
```

</td>
<td>

```bash
pnpm add @reduxjs/toolkit react-redux
# 持久化
# pnpm add redux-persist
# 计算属性
# pnpm add reselect
```

</td>
</tr>
<tr>
<th colspan="2">
初始化
</th>
</tr>
<tr>
<td valign="top">

```typescript
// store.ts
import { store } from 'foca';

foca.init({});
```

</td>
<td>

```typescript
// store.ts
import { useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    // 项目中所有reducer都要import注册到这里（枯燥）
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

</td>
</tr>
<tr>
<th colspan="2">
注入React
</th>
</tr>
<tr>
<td valign="top">

```typescript
import './store';
import { FocaProvider } from 'foca';

ReactDOM.render(
  <FocaProvider>
    <App />
  </FocaProvider>,
);
```

</td>
<td>

```typescript
import { store } from './store';
import { Provider } from 'react-redux';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
```

</td>
</tr>
<tr>
<th colspan="2">
创建Reducer
</th>
</tr>
<tr>
<td valign="top">

```typescript
// counter.model.ts
import { defineModel } from 'foca';

const initialState: { value: number } = {
  value: 0,
};

export const counterModel = defineModel('counter', {
  initialState,
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
    incrementByAmount(state, amount: number) {
      state.value += amount;
    },
  },
});
```

</td>
<td>

```typescript
// counterSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const initialState: { value: number } = {
  value: 0,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
  },
});

const { actions, reducer } = counterSlice;
export const { increment, decrement, incrementByAmount } = actions;
export default reducer;
```

</td>
</tr>
<tr>
<th colspan="2">
组件中获取数据
</th>
</tr>
<tr>
<td valign="top">

```tsx
import { useModel } from 'foca';
import { counterModel } from './counter.model';

export const Counter: FC = () => {
  const count = useModel(counterModel, (state) => state.value);

  return <div onClick={counterModel.increment}>{count}</div>;
};
```

</td>
<td>

```tsx
import { useAppSelector, useAppDispatch } from './store';
import { increment } from './counterSlice';

export const Counter: FC = () => {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return <div onClick={() => dispatch(increment())}>{count}</div>;
};
```

</td>
</tr>
<tr>
<th colspan="2">
异步请求和loading
</th>
</tr>
<tr>
<td valign="top">

```typescript
import { defineModel } from 'foca';

export const todoModel = defineModel('todos', {
  initialState: { todos: [] },
  reducers: {},
  methods: {
    // 返回Promise时自带loading
    async fetchTodos() {
      const response = await http.request('/api');
      this.setState({ todos: response.data });
    },
  },
});
```

</td>
<td>

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTodosAsync = createAsyncThunk(
  'todos/fetchTodos',
  async () => {
    const response = await http.request('/api');
    return response.data;
  },
);

const todoSlice = createSlice({
  name: 'todos',
  initialState: { todos: [], loading: false },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchTodosAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodosAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodosAsync.rejected, (state, action) => {
        state.loading = false;
      });
  },
});

export default todosSlice.reducer;
```

</td>
</tr>
<tr>
<th colspan="2">
在组件中使用loading状态
</th>
</tr>
<tr>
<td valign="top">

```typescript
import { useLoading } from 'foca';
import { todoModel } from './todo.model';

const Todo: FC = () => {
  const loading = useLoading(todoModel.fetchTodos);

  useEffect(() => {
    todoModel.fetchTodos();
  }, []);

  return <div />;
};
```

</td>
<td>

```typescript
import { useAppSelector, useAppDispatch } from './store';

const Todo: FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.todos.loading);

  useEffect(() => {
    dispatch(fetchTodosAsync());
  }, [dispatch]);

  return <div />;
};
```

</td>
</tr>
<tr>
<th colspan="2">
持久化
</th>
</tr>
<tr>
<td valign="top">

```typescript
import { store } from 'foca';
import { counterModel } from './counter.model';

foca.init({
  persist: [
    {
      key: 'root',
      engine: localStorage,
      models: [counterModel],
    },
  ],
});
```

</td>
<td>

```bash
pnpm add redux-persist
```

```typescript
import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import counterReducer from './counterSlice';

const reducers = combineReducers({
  counter: counterReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['counter'],
};

const persistedReducer = persistReducer(persistConfig, reducers);
const store = configureStore({ reducer: persistedReducer });

export default store;
```

```tsx
import { store } from './store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistStore(store)}>
      <App />
    </PersistGate>
  </Provider>,
);
```

</td>
</tr>
<tr>
<th colspan="2">
计算属性
</th>
</tr>
<tr>
<td valign="top">

```typescript
import { defineModel } from 'foca';

export const todoModel = defineModel('todos', {
  initialState: { todos: [] },
  computed: {
    todos() {
      return this.state.todos.filter((todo) => !!todo.completed);
    },
  },
});

// 在组件中使用
const memoTodos = useComputed(todoModel.todos);
```

</td>
<td>

```bash
pnpm add reselect
```

```typescript
import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

const todoSlice = createSlice({
  name: 'todos',
  initialState: { todos: [] },
});

const memoizedSelectCompletedTodos = createSelector(
  [(state: RootState) => state.todos],
  (todos) => {
    return todos.filter((todo) => !!todo.completed);
  },
);

// 在组件中使用
const memoTodos = memoizedSelectCompletedTodos(state);
```

</td>
</tr>
</tbody>
</table>
