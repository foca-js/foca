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
  reducers: {
    changeFirstName(state, value: string) {
      state.firstName = value;
    },
    changeLastName(state, value) {
      state.lastName = value;
    },
  },
  methods: {
    effectsGetFullName() {
      return this.fullName.value;
    },
  },
  computed: {
    fullName() {
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
    testFind() {
      return this.state.statusList.find((item) => item.startsWith('off'));
    },
    testVisitArray() {
      return this.state.statusList;
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
});
