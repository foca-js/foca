import { expectType } from 'ts-expect';
import { ComputedRef } from '../../src';
import { computedModel } from '../models/computedModel';

expectType<ComputedRef<string>>(computedModel.fullName);
// @ts-expect-error
computedModel._privateFullname;
