import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'endWord',
})
export class EndWordPipe implements PipeTransform {
  transform(n: number, args: string[]): string {
    n = Math.abs(n) % 100;
    let n1 = n % 10;
    if (n > 10 && n < 20) {
      return args[2];
    }
    if (n1 > 1 && n1 < 5) {
      return args[1];
    }
    if (n1 == 1) {
      return args[0];
    }
    return args[2];
  }
}
