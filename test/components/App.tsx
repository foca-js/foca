import React, { FC } from 'react';
import { connect, useLoading, useMeta, useModel } from '../../src';
import { basicModel } from '../models/basic-model';
import { complexModel } from '../models/complex-model';

type Props = ReturnType<typeof mapStateToProps>;

const App: FC<Props> = ({ countFromConnect }) => {
  const count1 = useModel(basicModel).count;
  const count2 = useModel(basicModel, (state) => state.count);
  const state1 = useModel(basicModel, complexModel);
  const state2 = useModel(basicModel, complexModel, (a, b) => a.count + b.ids.size);
  const loading1 = useLoading(basicModel.pureAsync);
  const loading2 = useLoading(basicModel.foo, basicModel.pureAsync);
  const message = useMeta(basicModel.hasError).message || '--';

  return (
    <>
      <div id="count1">{count1}</div>
      <div id="count2">{count2}</div>
      <div id="state1">{Object.keys(state1).sort().join(',')}</div>
      <div id="state2">{state2}</div>
      <div id="loading1">{String(loading1)}</div>
      <div id="loading2">{String(loading2)}</div>
      <div id="message">{message}</div>
      <div id="countFromConnect">{countFromConnect}</div>
    </>
  );
};

const mapStateToProps = () => {
  return {
    countFromConnect: basicModel.state.count + complexModel.state.ids.size,
  };
};

export default connect(mapStateToProps)(App);
