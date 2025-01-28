import { formatDate, formatNumber } from '@angular/common';
import { isString } from 'util';
import { ControlType, FilterTarget, FilterType, ValueType } from './components/data-table/data-table.models';
import * as moment from 'moment';

export function parseDate(date): any {
  const parsedDate = reverseDate(date);
  return formatDate(parsedDate, 'mediumDate', 'ru');
}

export const dateReplaceInvalidUrl = (location, value, key, defaultDate: string) => {
  if (!dateFilterFn(value)) {
    const regexp = new RegExp(`(${key}=)(\\d{2}).(\\d{2}).(\\d{4})`, 'g');
    const url = document.location.pathname + document.location.search.replace(regexp, `${key}=${defaultDate}`);
    location.go(url);
    return defaultDate;
  }
};

export function reverseDate(date): any {
  return date.split('.').reverse().join('-') + 'T00:00:00';
}

export function getType(param) {
  if (param.includes(ValueType.STRING)) {
    return ValueType.STRING;
  }
  if (param.includes(ValueType.NUMBER)) {
    return ValueType.NUMBER;
  }
  if (param.includes(ValueType.BOOLEAN)) {
    return ValueType.BOOLEAN;
  }
  if (param.includes(ValueType.OBJECT)) {
    return ValueType.OBJECT;
  }
  if (param.includes(ValueType.ARRAY)) {
    return ValueType.ARRAY;
  }
  return undefined;
}
export function parseByType(type: ValueType, value, isFilter = false) {
  if (type === ValueType.BOOLEAN) {
    return value === '' ? undefined : value === 'true';
  }
  if (type === ValueType.NUMBER) {
    if (isFilter) {
      return !isFinite(+value) || +value === 0 ? undefined : +value;
    } else {
      return isFinite(+value) ? +value : 0;
    }
  }
  if (type === ValueType.OBJECT) {
    return value || undefined;
  }
  if (type === ValueType.ARRAY) {
    return value ? (Array.isArray(value) ? value : value?.split(',')?.map(el => +el)) : [];
  }
  if (type === ValueType.STRING) {
    return value === '' ? undefined : value;
  }
  return undefined;
}

export function parseFrontFilterType(param) {
  if (param.includes(FilterType.NONE)) {
    return FilterType.NONE;
  }
  if (param.includes(FilterType.EQUAL)) {
    return FilterType.EQUAL;
  }
  if (param.includes(FilterType.GRATE_THEN)) {
    return FilterType.GRATE_THEN;
  }
  if (param.includes(FilterType.LESS_THEN)) {
    return FilterType.LESS_THEN;
  }
  if (param.includes(FilterType.INCLUDES_STR)) {
    return FilterType.INCLUDES_STR;
  }
  if (param.includes(FilterType.INCLUDES_NUM)) {
    return FilterType.INCLUDES_NUM;
  }
  return undefined;
}
export function filteredByType(type, sourceValue, matchValue) {
  if (type === FilterType.NONE) {
    return sourceValue === matchValue;
  }
  if (type === FilterType.EQUAL) {
    return sourceValue === matchValue;
  }
  if (type === FilterType.GRATE_THEN) {
    return sourceValue > matchValue;
  }
  if (type === FilterType.LESS_THEN) {
    return sourceValue < matchValue;
  }
  if (type === FilterType.INCLUDES_STR) {
    return String(sourceValue).toLowerCase().includes(String(matchValue).toLowerCase());
  }
  if (type === FilterType.INCLUDES_NUM) {
    return matchValue.includes(sourceValue);
  }
  return undefined;
}

export function replaceType(param) {
  const filterTypes = Object.values(FilterType).filter(el => isString(el));
  const filterTargets = Object.values(FilterTarget).filter(el => isString(el));
  const valueTypes = Object.values(ValueType).filter(el => isString(el));
  const replacer = (arr, value) => {
    arr.forEach(el => {
      value = value.replace(el, '');
    });
    return value;
  };

  let value = param;
  value = replacer(filterTypes, value);
  value = replacer(filterTargets, value);
  const type = getType(value);
  value = replacer(valueTypes, value);

  value = parseByType(type, value, true);
  return value;
}

export function parseFilter(type: ControlType, value) {
  if (type === ControlType.DATE_MONTH) {
    return parseMoment(value);
  }
  if (type === ControlType.DATE_PERIOD) {
    return {
      startDate: parseMoment(value.startDate),
      endDate: parseMoment(value.endDate),
    };
  }
  return value;
}
export const dateFilterFn = (date: string) => {
  if (!date) {
    return false;
  }
  const nowDate = moment().startOf('day');
  const curDate = parseMoment(date).startOf('day');
  return nowDate.isSameOrAfter(curDate);
};

export function parseMoment(date) {
  if (!date) {
    return moment();
  }
  if (moment.isMoment(date)) {
    return date;
  }
  return moment(date.split('.').reverse().join('-'));
}

export function parseNumber(value, locale = 'ru', replacer = '1.1-1') {
  return formatNumber(value, locale, replacer);
}

export function parseNumberWithPrefix(value, prefix = '', locale = 'ru', replacer = '1.1-1') {
  return parseNumber(value, 'ru', replacer) + ' ' + prefix;
}

export function periodFromRegDate(startDate) {
  const created_at_date = moment(localStorage.getItem('created_at'));
  if (startDate < created_at_date) return created_at_date;
  return startDate;
}
