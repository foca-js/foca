const counter: Record<string, number> = {};

export const guard = (modelName: string) => {
  counter[modelName] ||= 0;

  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => {
      --counter[modelName]!;
    });
  }

  if (++counter[modelName] > 1) {
    throw new Error(`模型名称'${modelName}'被重复使用`);
  }
};
