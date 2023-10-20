import { expectType } from 'ts-expect';
import { useModel } from '../../src';
import { basicModel } from '../models/basic.model';
import { complexModel } from '../models/complex.model';

const basic = useModel(basicModel);

expectType<number>(basic.count);
expectType<string>(basic.hello);
// @ts-expect-error
basic.notExist;

const count = useModel(basicModel, (state) => state.count);
expectType<number>(count);

const obj = useModel(basicModel, complexModel);
expectType<number>(obj.basic.count);
expectType<number[]>(obj.complex.ids);
// @ts-expect-error
obj.notExists;

const hello = useModel(
  basicModel,
  complexModel,
  (basic, complex) => basic.hello + complex.ids.length,
);

expectType<string>(hello);
