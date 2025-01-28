import { Pipe, PipeTransform } from '@angular/core';
import { checkNumber } from '../math/formulas.base';

@Pipe({
  name: 'numericPostfix',
})
export class NumericPostfixPipe implements PipeTransform {
  transform(value: any, postfix = ''): string {
    const parseValue = value => {
      value = checkNumber(value, 0);
      if (value === 0) {
        return 0;
      }
      if (postfix === '%') {
        return String(Math.trunc(value));
      }

      return value.toFixed(2).replace('.', ',');
    };
    const postNumber = String(Math.trunc(value))?.length;
    if (!postfix && value) {
      if (postNumber > 3) {
        return parseValue(value / 1000) + 'k';
      }
    }

    return parseValue(value) + postfix;
  }
}
