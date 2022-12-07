import { expectType } from 'ts-expect';
import { getLoading } from '../../src';
import { basicModel } from '../models/basicModel';

expectType<boolean>(getLoading(basicModel.foo));
expectType<boolean>(getLoading(basicModel.foo.room).find('xx'));
expectType<boolean>(getLoading(basicModel.foo.room, 'xx'));
// @ts-expect-error
getLoading(basicModel.foo.room, basicModel.foo);
// @ts-expect-error
getLoading(basicModel.foo.room, true);
// @ts-expect-error
getLoading(basicModel.foo.room, false);
// @ts-expect-error
getLoading(basicModel.normalMethod.room);
