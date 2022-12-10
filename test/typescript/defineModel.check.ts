import { expectType } from 'ts-expect';
import { AnyAction, ComputedRef, defineModel } from '../../src';

// @ts-expect-error
defineModel('no-initial-state', {});

defineModel('null-state', {
  // @ts-expect-error
  initialState: null,
});

defineModel('string-state', {
  // @ts-expect-error
  initialState: '',
});

defineModel('array-state-reducers', {
  initialState: [] as { test: number }[],
  reducers: {
    returnNormal(_) {
      return [];
    },
    returnInitialize(_) {
      return this.initialState;
    },
  },
  methods: {
    returnNormal() {
      this.setState([]);
      this.setState([{ test: 3 }]);
      // @ts-expect-error
      this.setState();
      // @ts-expect-error
      this.setState({});
      // @ts-expect-error
      this.setState(2);
      // @ts-expect-error
      this.setState();
      // @ts-expect-error
      this.setState([undefined]);
      // @ts-expect-error
      this.setState([{ test: 3 }, {}]);
      // @ts-expect-error
      this.setState(undefined);

      this.setState((_) => {
        return [];
      });
      // @ts-expect-error
      this.setState((_) => {
        return [] as object[];
      });
      this.setState((state) => {
        state.push({ test: 3 });
        // @ts-expect-error
        state.push(4);
      });
    },
    returnInitialize() {
      this.setState(() => {
        return this.initialState;
      });
      this.setState(this.initialState);
    },
  },
});

defineModel('object-state-reducers', {
  initialState: {} as {
    test: { test1: number };
    test2: string;
    test3?: string;
  },
  reducers: {
    returnNormal(_state) {
      return { test: { test1: 3 }, test2: 'bar' };
    },
    returnInitialize() {
      return this.initialState;
    },
  },
  methods: {
    returnNormal() {
      this.setState((_) => {
        return {};
      });
      this.setState((_) => {
        return { test: { test1: 2 } };
      });
      this.setState((_) => {
        return { test: { test1: 2 }, test2: 'bar' };
      });
      // FIXME:
      this.setState((_) => {
        return { test: { test1: 2 }, test2: 'bar', test3: '', other: '' };
      });
      // @ts-expect-error
      this.setState((_) => {
        return { test: { test1: 2 }, foo1: 'baz' };
      });
      // @ts-expect-error
      this.setState((_) => {
        return { xxx: 2 };
      });
      // @ts-expect-error
      this.setState((_) => {
        return { test: {} };
      });
      // @ts-expect-error
      this.setState((_) => {
        return { test: { test1: 2 }, t: 3 };
      });
      // FIXME:
      this.setState((_) => {
        return { test: { test1: 2, t: 3 } };
      });
      // @ts-expect-error
      this.setState((_) => {
        return { test: { test2: 2 } };
      });
      this.setState((state) => {
        state.test.test1 = 4;
      });
    },
    returnPartial() {
      this.setState({});
      this.setState({ test: { test1: 3 } });
      // @ts-expect-error
      this.setState({ test: { test1: 3, more: 4 } });
      // @ts-expect-error
      this.setState({ test: { test1: 3, more: undefined } });

      this.setState({ test3: undefined });
      this.setState({ test2: 'x', test3: undefined });
      // @ts-expect-error
      this.setState({ test: { test1: undefined } });

      // @ts-expect-error
      this.setState({ test2: undefined });
      // @ts-expect-error
      this.setState({ test: 'x' });
      // @ts-expect-error
      this.setState({ test: { test1: 'x' } });
      // @ts-expect-error
      this.setState({ test: { test1: 3 }, ok: 'test', more: 'test1' });
      // @ts-expect-error
      this.setState();
      // @ts-expect-error
      this.setState({ test: {} });
      // @ts-expect-error
      this.setState([]);
      // @ts-expect-error
      this.setState(2);
      // @ts-expect-error
      this.setState({ xxx: 2 });
      this.setState({ test2: 'x' });
      // @ts-expect-error
      this.setState({ test2: 'x', more: 'y' });
    },
    returnInitialize() {
      this.setState(() => {
        return this.initialState;
      });
      this.setState(this.initialState);
    },
  },
});

defineModel('wrong-reducer-state-1', {
  initialState: {} as { test: { test1: number } },
  // @ts-expect-error
  reducers: {
    returnUnexpected(_) {
      return { test: {} };
    },
    right() {
      return { test: { test1: 3 } };
    },
  },
});

defineModel('wrong-reducer-state-2', {
  initialState: {} as { test: { test1: number } },
  // @ts-expect-error
  reducers: {
    returnUnexpected(_) {
      return {};
    },

    right() {
      return { test: { test1: 3 } };
    },
  },
});

defineModel('wrong-reducer-state-3', {
  initialState: {} as { test: { test1: number } },
  // @ts-expect-error
  reducers: {
    returnUnexpected(_) {
      return [];
    },
    right() {
      return { test: { test1: 3 } };
    },
  },
});

defineModel('private-and-context', {
  initialState: {},
  reducers: {
    _action1() {},
    _action2() {},
    action3() {
      // @ts-expect-error
      this.method3;
      // @ts-expect-error
      this.xxx;
      // @ts-expect-error
      this._fullname;
    },
  },
  methods: {
    _method1() {
      this._action1();
    },
    async _method2() {},
    method3() {
      this._method1();
      this.xxx.value.endsWith('/');
      this._fullname.value.endsWith('/');
    },
  },
  computed: {
    xxx() {
      // @ts-expect-error
      this._method1;
      // @ts-expect-error
      this._action1;
      // @ts-expect-error
      this.method3;

      return '';
    },
    _fullname() {
      return '';
    },
  },
  events: {
    onInit() {
      this._action1();
      this._method1();
      this.action3();
      this.method3();
      this.state;
      // @ts-expect-error
      this.initialState;
      // @ts-expect-error
      this.onInit;

      expectType<ComputedRef<string>>(this._fullname);
      expectType<string>(this._fullname.value);
      expectType<() => Promise<void>>(this._method2);
      expectType<() => AnyAction>(this._action1);
      expectType<() => AnyAction>(this._action2);
    },
  },
});
