import { PersistItem, PersistOptions } from './PersistItem';
import assign from 'object-assign';

export class PersistManager {
  protected readonly list: PersistItem[] = [];
  protected updateTimer?: NodeJS.Timeout;

  constructor(options: PersistOptions[]) {
    this.list = options.map((option) => new PersistItem(option));
  }

  init() {
    return Promise.all(
      this.list.map((item) => {
        return item.init();
      }),
    );
  }

  update(nextState: Record<string, object>) {
    this.updateTimer && clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      this.updateTimer = undefined;
      this.list.forEach((item) => {
        item.update(nextState);
      });
    });
  }

  collect(): Record<string, object> {
    const stateMaps: Record<string, object> = {};

    this.list.forEach((item) => {
      assign(stateMaps, item.collect());
    });

    return stateMaps;
  }
}
