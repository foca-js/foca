如果你写烦了函数式组件，偶尔想写一下 class 组件，那么 foca 已经为你准备好了`connect()`函数。如果不知道这是什么，可以参考[react-redux](https://github.com/reduxjs/react-redux)的文档。事实上，我们内置了这个库并对其做了一些封装。

```typescript
import { PureComponent } from 'react';
import { connect } from 'foca';
import { userModel } from './userModel';

type Props = ReturnType<typeof mapStateToProps>;

class App extends PureComponent<Props> {
  render() {
    const { users, loading } = this.props;

    if (loading) {
      return <p>Loading...</p>;
    }

    return <p>Hello, {users.length} people</p>;
  }
}

const mapStateToProps = () => {
  return {
    users: userModel.state,
    loading: getLoading(userModel.fetchUser),
  };
};

export default connect(mapStateToProps)(App);
```

没有了 hooks 的帮忙，我们只能从模型或者方法上获取实时的数据。但只要你是在 mapStateToProps 中获取的数据，foca 就会自动为你更新并注入到组件里。
