interface ThrottleOptions {
  // 先頭での実行を行うか
  leading?: boolean;
  // 末尾での実行を行うか
  trailing?: boolean;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  let lastArgs: Parameters<T> | null = null;

  const { leading = true, trailing = true } = options;

  const later = () => {
    previous = leading === false ? 0 : Date.now();
    timeout = null;
    if (lastArgs && trailing) {
      func.apply(null, lastArgs);
      lastArgs = null;
    }
  };

  return function throttled(this: any, ...args: Parameters<T>): void {
    const now = Date.now();

    if (!previous && leading === false) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    // 最初の実行または待機時間が経過している場合
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      func.apply(this, args);
      lastArgs = null;
    } else if (!timeout && trailing) {
      // trailing edgeの実行をスケジュール
      lastArgs = args;
      timeout = setTimeout(later, remaining);
    }
  };
}
