import { expectType } from 'ts-expect';
import { useLoading } from '../../src';
import { basicModel } from '../models/basic.model';

expectType<boolean>(useLoading(basicModel.bar));
expectType<boolean>(useLoading(basicModel.foo, basicModel.bar));
// @ts-expect-error
useLoading(basicModel.minus);
// @ts-expect-error
useLoading(basicModel);
// @ts-expect-error
useLoading({});

expectType<boolean>(useLoading(basicModel.foo.room).find('xx'));
expectType<boolean>(useLoading(basicModel.foo.room, 'xx'));
// @ts-expect-error
useLoading(basicModel.foo.room, basicModel.foo);
// @ts-expect-error
useLoading(basicModel.foo.room, true);
// @ts-expect-error
useLoading(basicModel.foo.room, false);
// @ts-expect-error
useLoading(basicModel.normalMethod.room);
// @ts-expect-error
useLoading(basicModel.normalMethod.assign);
// @ts-expect-error
useLoading(basicModel.minus.room);
