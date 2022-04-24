import { defineModel } from '../../src';

const initialState: {
  firstName: string;
  lastName: string;
  statusList: [string, string];
  translate: Record<string, string>;
} = {
  firstName: 'tick',
  lastName: 'tock',
  statusList: ['online', 'offline'],
  translate: {
    online: 'Online',
    offline: 'Offline',
  },
};

export const computedModel = defineModel('computed-model', {
  initialState,
  actions: {
    changeFirstName(state, value: string) {
      state.firstName = value;
    },
    changeLastName(state, value) {
      // @ts-expect-error
      this.changeFirstName;
      // @ts-expect-error
      this.fullName;

      state.lastName = value;
    },
  },
  effects: {
    effectsGetFullName() {
      // type checking
      this._privateFullname;

      return this.fullName.value;
    },
  },
  computed: {
    fullName() {
      // @ts-expect-error
      this.changeFirstName;
      // @ts-expect-error
      this.noop;

      return this.state.firstName + this.state.lastName;
    },
    _privateFullname() {
      return this.state.firstName + this.state.lastName;
    },
    testDependentOtherComputed() {
      const status =
        this.fullName.value === 'ticktock'
          ? this.state.statusList[0]
          : this.state.statusList[1];
      return `${this.fullName.value.trim()} [${status}]`;
    },
    isOnline() {
      return this.fullName.value === 'helloworld';
    },
    testArrayLength() {
      return this.state.statusList.length;
    },
    testObjectKeys() {
      return Object.keys(this.state.translate);
    },
    testJSON() {
      return JSON.stringify(this.state);
    },
    testExtendObject() {
      this.state.statusList.push('k');
    },
    testModifyValue() {
      this.state.statusList[0] = 'BALA';
    },
    a() {
      this.b.value;
    },
    b() {
      this.c.value;
    },
    c() {
      this.a.value;
    },
  },
  hooks: {
    onInit() {
      // type checking
      this.fullName;
      this._privateFullname;
    },
  },
});
