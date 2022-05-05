const counter: Record<string, number> = {};

export const guard = (uniqueName: string) => {
  counter[uniqueName] ||= 0;

  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => {
      --counter[uniqueName];
    });
  }

  if (++counter[uniqueName] > 1) {
    throw new Error(`You have used "${uniqueName}" as model name many times.`);
  }
};
