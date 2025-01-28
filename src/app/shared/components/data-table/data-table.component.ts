import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DataTableService } from './data-table.service';
import { catchError, map, mapTo, switchMap, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CellContentComponent } from './content/cell-content/cell-content.component';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ControlType, DataTable, DataTableActions, FilterOptions, FilterTarget, ValueType } from './data-table.models';
import { ActivatedRoute, Router } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import {
  dateReplaceInvalidUrl,
  filteredByType,
  parseByType,
  parseFilter,
  parseFrontFilterType,
  replaceType,
} from '../../helpers';
import { timer } from 'rxjs';
import { isEqual } from 'lodash';
import { Location } from '@angular/common';
import * as moment from 'moment';

const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MMMM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@UntilDestroy()
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    Location,
  ],
})
export class DataTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort)
  sort: MatSort;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  @ViewChild(CellContentComponent)
  content: ComponentRef<CellContentComponent>;

  @Input()
  dataTable: DataTable<any>;

  @Input()
  showPagination: boolean = true;

  @Input()
  loading: boolean = false;

  @Input()
  selectedItemId: string;

  @Input()
  maxHeight = 70;

  @Output()
  filtersChange: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  filteredData: EventEmitter<any> = new EventEmitter<any>();

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalData = [];
  filters = {};
  isInited = false;

  VALUE_CONTROL_TYPE = ValueType;
  FILER_CONTROL_TYPE = ControlType;
  filtersFront = {};
  filtersBack = {};
  tableHeight = 0;

  constructor(
    private dataTableService: DataTableService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) {}

  getParams() {
    this.activatedRoute.queryParams
      .pipe(
        map(params => (this.filters = { ...this.filters, ...params })),
        switchMap(() => this.activatedRoute.queryParamMap.pipe(untilDestroyed(this))),
        untilDestroyed(this)
      )
      .subscribe(() => {
        const filters = {
          keys: Object.keys(this.filters),
          get: key => this.filters[key],
        };

        let { filtersBack, filtersFront } = filters.keys.reduce(
          (acc, key) => {
            if (filters.get(key)?.includes(FilterOptions.SKIP)) {
              return acc;
            }

            if (filters.get(key)?.includes(FilterTarget.BACK)) {
              const backValue = replaceType(filters.get(key));
              if (['startDate', 'endDate', 'period'].includes(key)) {
                const defaultDate = ['startDate', 'period'].includes(key)
                  ? moment().startOf('month').format('DD.MM.YYYY')
                  : moment().format('DD.MM.YYYY');
                const validDate = dateReplaceInvalidUrl(this.location, backValue, key, defaultDate);
                if (validDate) {
                  acc.filtersBack[key] = validDate;
                } else {
                  acc.filtersBack[key] = backValue;
                }
              } else {
                acc.filtersBack[key] = backValue;
              }
            }
            if (filters.get(key)?.includes(FilterTarget.FRONT)) {
              acc.filtersFront[key] = {
                value: replaceType(filters.get(key)),
                type: parseFrontFilterType(filters.get(key)),
              };
            }
            return acc;
          },
          { filtersBack: {}, filtersFront: {} }
        );

        this.filtersFront = filtersFront;
        this.filtersBack = filtersBack;

        const allFilters = {
          ...this.filtersFront,
          ...Object.keys(this.filtersBack).reduce((acc, curKey) => {
            if (['startDate', 'endDate'].includes(curKey)) {
              acc['period'] = {
                value: {
                  ...acc['period']?.value,
                  [curKey]: this.filtersBack[curKey],
                },
              };
            } else {
              acc[curKey] = { value: this.filtersBack[curKey] };
            }

            return acc;
          }, {}),
        };

        Object.keys(allFilters).some(key => {
          const filterIndex = this.dataTable?.filters.findIndex(filter => filter.control.name === key);
          if (filterIndex !== -1) {
            // @ts-ignore
            this.dataTable?.filters[filterIndex].control.value = parseFilter(
              this.dataTable?.filters[filterIndex].control.type,
              allFilters[key].value
            );
          }
        });

        this.filtersChange.emit(this.dataTable?.filters);

        this.loadList(filtersBack);
      });
  }
  ngOnInit(): void {
    this.isInited = false;
    this.getParams();
  }
  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
    // this.dataSource.paginator = this.paginator;
  }

  startLoading = () => {
    this.loading = true;
    this.cd.detectChanges();
  };
  stopLoading = () => {
    this.loading = false;
    this.cd.detectChanges();
  };

  loadList(...args) {
    this.dataSource.filteredData = [];
    this.startLoading();

    let action = this.dataTable.crudAPI.list(...args);

    const store = JSON.parse(localStorage.getItem(this.dataTable.tableName));
    if (this.isInited && isEqual(store?.filters, this.filtersBack)) {
      action = timer(10).pipe(mapTo(store.payload));
      // console.log('CACHED');
    } else {
      // console.log('SERVER');
    }
    localStorage.removeItem(this.dataTable.tableName);
    this.isInited = true;

    action
      .pipe(
        map(data => {
          if (this.dataTable?.crudAPI?.listSide) {
            data = this.dataTable?.crudAPI?.listSide(data);
          }
          localStorage.setItem(this.dataTable.tableName, JSON.stringify({ filters: this.filtersBack, payload: data }));
          return data;
        }),
        map(data => {
          const keys = Object.keys(this.filtersFront);
          return keys?.length
            ? keys.reduce((acc, key) => {
                data = data.filter(el => {
                  return filteredByType(this.filtersFront[key].type, el[key], this.filtersFront[key].value);
                });
                return data;
              }, [])
            : data;
        }),
        tap(data => {
          this.dataSource = new MatTableDataSource<any>(data);
          this.originalData = [...data];
          this.filteredData.emit(data);
          this.cd.detectChanges();
        }),
        catchError(err => {
          this.stopLoading();
          return err;
        }),
        untilDestroyed(this)
      )
      .subscribe(this.stopLoading, this.stopLoading);
  }

  updListSync(item, isDelete?: boolean) {
    let arr = this.originalData;
    const currentItemIndex = arr.findIndex(el => el.id === item?.id);

    if (currentItemIndex != -1) {
      if (isDelete) {
        arr.splice(currentItemIndex, 1);
      } else {
        arr[currentItemIndex] = {
          ...arr[currentItemIndex],
          ...item,
        };
      }
    }

    this.dataSource = new MatTableDataSource<any>(arr);
    this.originalData = [...arr];
    this.cd.detectChanges();
  }

  get pageSizes() {
    const size = this.dataSource?.filteredData?.length || 0;

    if (size > 100) {
      return [5, 10, 25, 50, 100, size];
    }

    if (size > 50) {
      return [5, 10, 25, 50, size];
    }
    if (size > 25) {
      return [5, 10, 25, size];
    }

    if (size > 25) {
      return [5, 10, size];
    }

    if (size > 10) {
      return [5, size];
    }

    return [size];
  }

  cellFn = index => index;

  calculateCell(callback, item, items = []) {
    return callback(item, items);
  }
  cellTemplate(content, item, items = []) {
    if (content?.templateCalculated) {
      content.template = this.calculateCell(content?.templateCalculated, item, items);
    }
    return content?.template || undefined;
  }
  cellTemplateContext(content, item, items = []) {
    if (content?.contextCalculated) {
      content.context = this.calculateCell(content?.contextCalculated, item, items);
    }
    return content?.context || undefined;
  }

  // SELECT
  selectItem(item) {
    if (this.dataTable?.actions?.has(DataTableActions.SELECT) && !this.selectedItemId) {
      this.dataTable.actions.get(DataTableActions.SELECT)(item.rowId);
    } else if (item.rowId !== this.selectedItemId) {
      this.dataTable.actions.get(DataTableActions.SELECT)(item.rowId);
    }
  }
  changeItem(item) {
    if (this.dataTable?.actions?.has(DataTableActions.CHANGE) && this.selectedItemId && item) {
      this.dataTable.actions.get(DataTableActions.CHANGE)(item);
    }
  }
  setControlValue(cellConfig, changes, item) {
    cellConfig.control.value = changes;
    const updatedItemIndex = this.dataSource.filteredData.findIndex(el => el.id === item.id);
    if (updatedItemIndex != -1) {
      this.dataSource.filteredData[updatedItemIndex] = {
        ...this.dataSource.filteredData[updatedItemIndex],
        [cellConfig.control.name]: parseByType(cellConfig.control.valueType, changes, true),
      };
      this.changeItem(this.dataSource.filteredData[updatedItemIndex]);
    }
  }

  resetControlValue(id) {
    const changedItemIndex = this.dataSource.filteredData.findIndex(el => el.id === id);
    const originalItemIndex = this.originalData.findIndex(el => el.id === id);
    if (changedItemIndex != -1) {
      this.dataSource.filteredData[changedItemIndex] = {
        ...this.originalData[originalItemIndex],
      };
      this.changeItem(this.dataSource.filteredData[changedItemIndex]);
    }
  }
  clickOutsideTable() {
    if (this.selectedItemId) {
      this.resetControlValue(this.selectedItemId);
    }
    this.selectedItemId = null;
  }
}
