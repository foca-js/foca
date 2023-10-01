import { expectType } from 'ts-expect';
import { cloneModel, defineModel, useComputed } from '../../src';
import { ComputedFlag } from '../../src/model/types';

const model = defineModel('test', {
  initialState: {
    firstName: 't',
    lastName: 'r',
  },
  computed: {
    fullName() {
      return this.state.firstName + '.' + this.state.lastName;
    },
    nickName() {
      return [this.fullName() + '-nick'];
    },
    _dirname() {
      return 'whatever';
    },
    withAge(age: number = 20) {
      return this.state.firstName + '-age-' + age;
    },
    withRequiredParameter(address: string) {
      return this.state.firstName + this.withAge(15) + '-address-' + address;
    },
    withMultipleParameter(address: string, age: number, extra?: boolean) {
      return address + age + extra;
    },
  },
});

expectType<(() => string[]) & ComputedFlag>(model.nickName);

// @ts-expect-error
model.fullName = 'modify';
// @ts-expect-error
model.nickName = 'modify';
// @ts-expect-error
model._dirname;
// @ts-expect-error
model.firstName;

// @ts-expect-error
useComputed(model);
expectType<string>(useComputed(model.fullName));
expectType<string[]>(useComputed(model.nickName));
// @ts-expect-error
useComputed(model.fullName, 20);
useComputed(model.withAge);
useComputed(model.withAge, 20);
// @ts-expect-error
useComputed(model.withAge, '20');
// @ts-expect-error
useComputed(() => {});
// @ts-expect-error
useComputed(model.withRequiredParameter);
expectType<string>(useComputed(model.withRequiredParameter, 'addr'));
useComputed(model.withRequiredParameter, 'addr').endsWith('ss');
// @ts-expect-error
useComputed(model.withMultipleParameter, '');
// @ts-expect-error
useComputed(model.withMultipleParameter, 0);
useComputed(model.withMultipleParameter, '', 0);
useComputed(model.withMultipleParameter, '', 0, false);

{
  const model1 = cloneModel('clone-model', model);
  model1.fullName();
  model1.withMultipleParameter('', 20);
}
