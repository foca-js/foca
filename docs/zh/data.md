# <!-- {docsify-ignore} -->

# name

模型的名称，也是 reducer 的名称，通过`model.name`获取。每个模型的名称必须是**唯一的**字符串，否则会出现数据被覆盖的情况。

# state

模型的实时状态，通过`model.state`获取。你可以在任何地方使用，没有限制。但如果你想在组件里动态更新数据，就得配合 hooks 和 connect 了。

# loading

模型异步函数的当前状态，通过`getLoading(model.asyncXXX)`获取。

# initialState

只有在 actions 和 effects 方法内部才能使用。通过`this.initialState`获取。
