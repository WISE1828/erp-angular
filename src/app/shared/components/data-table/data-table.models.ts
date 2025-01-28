import { Observable } from 'rxjs';
import { TemplateRef } from '@angular/core';

interface CustomFields {
  styles?: any;
  classes?: any;
  sort?: any;
  content?: {
    template?: TemplateRef<any>;
    context?: Object | null;
    contextCalculated?: (...args) => Object | any;
    templateCalculated?: (...args) => TemplateRef<any>;
  };
  control?: DataTableControl;
  calculated?: (...args) => any;
  label?: string;
  sticky?: boolean;
  stickyEnd?: boolean;
}
export enum DataTableActions {
  SELECT = 'select',
  SAVE = 'save',
  CANCEL = 'cancel',
  CHANGE = 'change',
}

export interface DataTableCell extends CustomFields {}
export interface DataTableRow extends CustomFields {
  matColumnDef: string;
  header?: DataTableCell;
  cell: DataTableCell;
  footer?: DataTableCell;
}
export interface DataTable<T> {
  tableName: string;
  displayColumns: string[];
  displayFooter?: string[];
  rowConfig?: {
    header?: DataTableCell;
    footer?: DataTableCell;
  };
  filters?: DataTableFilter[];
  filterClasses?: any;
  cells: DataTableRow[];
  actions?: Map<DataTableActions, (...args) => any>;
  crudAPI?: {
    list?: (...args) => Observable<T[]>;
    listSide?: (...args) => any;
    update?: (...args) => Observable<any>;
    delete?: (...args) => Observable<any>;
  };
  mappers?: {
    listMapper?: (data: T[]) => T[];
  };
}

export enum ControlType {
  INPUT = 'input',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  SLIDER = 'slider',
  SEARCH_INPUT = 'search_input',
  DATE_PERIOD = 'date_period',
  DATE_MONTH = 'date_month',
}
export enum FilterTarget {
  ALL = '@all',
  FRONT = '@front',
  BACK = '@back',
}
export enum FilterType {
  NONE = '@none',
  EQUAL = '@equal',
  GRATE_THEN = '@grate_then',
  LESS_THEN = '@less_then',
  INCLUDES_STR = '@includes_str',
  INCLUDES_NUM = '@includes_num',
}
export enum FilterOptions {
  SKIP = '@skip',
}
export enum ValueType {
  STRING = '@string',
  NUMBER = '@number',
  BOOLEAN = '@boolean',
  OBJECT = '@object',
  ARRAY = '@array',
}
export interface DataTableFilter {
  types?: FilterType;
  label: string;
  direction: FilterTarget;
  hidden?: boolean;
  control: DataTableControl;
}

export interface DataTableControl {
  value?: any;
  search?: any;
  calculatedValue?: (...args) => any;
  setValue?: (...args) => any;
  type: ControlType;
  name: string;
  source?: any;
  valueType: ValueType;
  maxValue?: number;
  minValue?: number;
  disableMulti?: boolean;
}
