import { TypeEqual, expectType } from 'ts-expect';
import { defineModel, useIsolate, useLoading, useModel } from '../../src';
import { basicModel } from '../models/basic.model';

const isolatedModel = useIsolate(basicModel);

useModel(isolatedModel);
useModel(isolatedModel, (state) => state.count);
useLoading(isolatedModel.pureAsync);
useLoading(isolatedModel.pureAsync.room);

useModel(basicModel, isolatedModel);
{
  const model = useModel(isolatedModel, basicModel);
  expectType<
    TypeEqual<
      {
        basic: { count: number; hello: string };
      } & {
        [x: string]: {
          count: number;
          hello: string;
        };
      },
      typeof model
    >
  >(true);
}

useModel(isolatedModel, basicModel, () => {});

{
  const model = useIsolate(isolatedModel);
  expectType<TypeEqual<typeof isolatedModel, typeof model>>(true);
}
// @ts-expect-error
cloneModel(isolatedModel);

defineModel('', {
  initialState: {},
  events: {
    onDestroy() {
      expectType<never>(this);
    },
  },
});
