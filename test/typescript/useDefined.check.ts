import { defineModel, useDefined, useLoading, useModel } from '../../src';
import { basicModel } from '../models/basicModel';

const hookModel = useDefined(basicModel);

useModel(hookModel);
useModel(hookModel, (state) => state.count);
useLoading(hookModel.pureAsync);
useLoading(hookModel.pureAsync.room);

// @ts-expect-error
useModel(basicModel, hookModel);
// @ts-expect-error
useModel(hookModel, basicModel);
// @ts-expect-error
useModel(hookModel, basicModel, () => {});

// @ts-expect-error
useDefined(hookModel);
// @ts-expect-error
cloneModel(hookModel);

defineModel('local-demo-1', {
  initialState: {},
  events: {
    onDestroy() {
      // @ts-expect-error
      this.anything;
    },
  },
});
