import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { dateFilterFn, parseByType } from '../../../helpers';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';
import { ControlType, DataTable, ValueType } from '../data-table.models';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-data-table-filters',
  templateUrl: './data-table-filters.component.html',
  styleUrls: ['../data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableFiltersComponent implements OnInit {
  @Input()
  loading;

  @Input()
  dataTable: DataTable<any>;

  @Input()
  filters = {};

  minDate = moment(localStorage.getItem('created_at')).startOf('month').toDate();

  viewConfig = {
    width: 0,
    countCells: 0,
    cellWidth: 0,
  };

  EMPTY_INPUT = 'Не выбрано';
  VALUE_CONTROL_TYPE = ValueType;
  FILER_CONTROL_TYPE = ControlType;

  calcWidth() {
    const width = window.innerWidth - 380;
    let countCells = this.dataTable.cells
      .map(el => {
        let key = Object.keys(el?.header?.classes || {}).filter(k => k.includes('w-'))[0];
        key = key?.replace('w-', '');
        return +key / 100;
      })
      .reduce((acc, cur) => acc + cur, 0);
    countCells = countCells < 10 ? 10 : countCells;

    let cellWidth = Math.ceil(width / countCells);
    cellWidth = cellWidth / 2;
    cellWidth = cellWidth < 60 ? 60 : cellWidth;
    this.viewConfig = {
      width,
      countCells,
      cellWidth,
    };
    document.documentElement.style.setProperty('--base-cell-width', cellWidth + 'px');
    // console.log(countCells, cellWidth);
  }
  get maxWidthFilters() {
    return this.viewConfig.countCells > 5 ? `${this.viewConfig.cellWidth * this.viewConfig.countCells * 2}px` : '100%';
  }
  parseMomentDate(date) {
    return date ? date.format('DD.MM.YYYY') : undefined;
  }

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.calcWidth();
  }

  // FILTERS
  applyFilter(filter, value) {
    const setFilter = (name, data) => {
      return {
        ...filters,
        ...{ [name]: data },
      };
    };

    let filters = this.filters;
    const parsedValue = parseByType(filter.control.valueType, value, true);
    const isNotEmptyArray = Array.isArray(parsedValue) && (parsedValue as any[])?.length;
    const isNotEmptyValue = !Array.isArray(parsedValue) && isNotNullOrUndefined(parsedValue);

    if (isNotEmptyArray || isNotEmptyValue) {
      const filterParams = (filter.direction || '') + (filter.control.valueType || '') + (filter.types || '');
      if (filter.control.valueType === ValueType.OBJECT) {
        Object.keys(value).forEach(key => {
          filters = {
            ...filters,
            ...setFilter(key, value[key] + filterParams),
          };
        });
      } else {
        filters = setFilter(filter.control.name, parsedValue + filterParams);
      }
    } else {
      if (filter.control.type === ValueType.OBJECT) {
        Object.keys(filter.control.value).forEach(key => {
          filters = {
            ...filters,
            ...setFilter(key, undefined),
          };
          this.filters[key] = undefined;
        });
      } else {
        filters = setFilter(filter.control.name, undefined);
        this.filters[filter.control.name] = undefined;
      }
    }

    setTimeout(() => {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: filters,
      });
    });
  }

  dateFilterFn = dateFilterFn;

  isMatch = (v1, v2) => {
    const value = String(v2)?.trim()?.includes(String(v1)?.trim());
    const valueLowerCase = String(v2)?.trim()?.toLowerCase()?.includes(String(v1)?.trim()?.toLowerCase());

    return !v1 || value || valueLowerCase;
  };
  isAllNotMatch = (arr, v) => arr?.every(el => !this.isMatch(v, el?.label));
}
