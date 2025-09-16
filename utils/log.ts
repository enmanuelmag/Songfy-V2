 

class LoggerImpl {
  private getPrefix() {
    return {
      text: '[BUDGETFY]',
      css: 'color:#ef9234;',
    };
  }

  private print(type: LogType, text: Array<string>, objects?: Array<object>): void {
    const prefix = this.getPrefix();
    const texts: Array<string> = [];
    const _objects: Array<any> = [];

    text.forEach((t) => {
      if (typeof t === 'string') {
        texts.push(t);
      } else {
        _objects.push(t);
      }
    });

    console[type](prefix.text + ' ' + texts.join(' '), ...(objects ?? []), ..._objects);
  }

  debug(...text: Array<any>): void {
    this.print('debug', ['[DEBUG]', ...text]);
  }

  debugWithObjects(text: Array<any>, objects: Array<any>): void {
    this.print('debug', ['[DEBUG]', ...text], objects);
  }

  info(...text: Array<any>): void {
    this.print('info', ['[INFO]', ...text]);
  }

  warn(...text: Array<any>): void {
    this.print('warn', ['[WARN]', ...text]);
  }

  error(...text: Array<any>): void {
    this.print('error', ['[ERROR]', ...text]);
  }
}

export const Logger = new LoggerImpl();

export type LogType = 'error' | 'warn' | 'debug' | 'info';
