<table>
<thead>
<tr>
<th width="140"></th>
<th>toolkit</th>
<th>foca</th>
</tr>
</thead>
<tbody>
<tr>
<th>开源时间</th>
<td>2018-03</td>
<td>2021-10</td>
</tr>
<tr>
<th>文档地址</th>
<td>

[foca.js.org](https://foca.js.org)（中文文档）

</td>
<td valign="top">

[redux-toolkit.js.org](https://redux-toolkit.js.org/)（English documentation）

</td>
</tr>
<tr>
<th>安装</th>
<td>

```bash
# 持久化和计算属性需额外安装插件
pnpm add @reduxjs/toolkit react-redux
```

</td>
<td>

```bash
pnpm add foca
```

</td>
</tr>
<tr>
<th>初始化</th>
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
<td valign="top">

```typescript
// store.ts
import { store } from 'foca';

foca.init({});
```

</td>
</tr>
<tr>
<th>注入React</th>
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
</tr>
<tr>
<th>创建Reducer</th>
<td>

```typescript
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const initialState: { value: number } = {
  value: 0,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

const { actions, reducer } = counterSlice;
export const { increment, decrement, incrementByAmount } = actions;
export default reducer;
```

</td>
<td valign="top">

```typescript
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
    incrementByAmount(state, amount: number /* ,arg2 ... */) {
      state.value += amount;
    },
  },
});
```

</td>
</tr>
<tr>
<th>组件中<br>获取数据</th>
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
</tr>
<tr>
<th>异步请求<br>和loading</th>
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
  initialState: { todos: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodosAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTodosAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.todos = action.payload;
      })
      .addCase(fetchTodosAsync.rejected, (state, action) => {
        state.status = 'failed';
      });
  },
});

export default todosSlice.reducer;
```

</td>
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
</tr>
<tr>
<th>组件中<br>使用loading</th>
<td>

```typescript
import { useAppSelector, useAppDispatch } from './store';

const Todo: FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.todos.status === 'loading');

  useEffect(() => {
    dispatch(fetchTodosAsync());
  }, [dispatch]);

  return null;
};
```

</td>
<td valign="top">

```typescript
import { useLoading } from 'foca';
import { todoModel } from './todo.model';

const Todo: FC = () => {
  const loading = useLoading(todoModel.fetchTodos);

  useEffect(() => {
    todoModel.fetchTodos();
  }, []);

  return null;
};
```

</td>
</tr>
<tr>
<th>持久化</th>
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
<td valign="top">

```typescript
import { store } from 'foca';
import { counterModel } from './counter.model';

foca.init({
  persist: [
    {
      key: 'root',
      storage: localStorage,
      models: [counterModel],
    },
  ],
});
```

</td>
</tr>
<tr>
<th>计算属性</th>
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
    return todos.filter((todo) => todo.completed === true);
  },
);

// 在组件中使用
const memoTodos = memoizedSelectCompletedTodos(state);
```

</td>
<td valign="top">

```typescript
import { defineModel } from 'foca';

export const todoModel = defineModel('todos', {
  initialState: { todos: [] },
  computed: {
    todos() {
      return this.state.todos.filter((todo) => todo.completed === true);
    },
  },
});

// 在组件中使用
const memoTodos = useComputed(todoModel.todos);
```

</td>
</tr>
</tbody>
</table>
