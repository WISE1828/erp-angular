import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import { IRowTable } from '../../timesheets/components/employee-attendance-table/employee-attendance-table.component';
import { IFilter, ReportGrouping } from '../../shared/services/traffic.service';
import { AuthService } from '../../shared/services/auth.service';
import { combineLatest, merge, of } from 'rxjs';
import { untilDestroyed } from '@ngneat/until-destroy';
import { formatDate } from '@angular/common';
import { map, tap } from 'rxjs/operators';
import { isString } from 'util';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { some } from 'lodash';

export enum FilterType {
  ALL,
  EQUAL,
  GRATE_THAN,
  LESS_THAN,
}

export enum FilterSource {
  FRONT,
  BACK,
}

export const DefaultSelect = { id: '', name: 'Все' };

@Component({
  template: '',
})
export abstract class TableTrafficBase implements OnInit, OnDestroy, AfterViewInit {
  FILTER_SOURCE = FilterSource;

  FILTER_TYPE = FilterType;

  metrics = new FormControl();

  metricsAllDefault = [
    { key: 'clicks', name: 'Клики', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'ts', name: 'Источники', checked: true, data: [], view: { symbol: '', type: 'str' } },
    {
      key: 'campaign_unique_clicks',
      name: 'Уникальные клики для кампании',
      checked: true,
      data: [],
      view: { symbol: '', type: 'empty' },
    },
    {
      key: 'stream_unique_clicks',
      name: 'Уникальные клики для потока',
      checked: true,
      data: [],
      view: { symbol: '', type: 'empty' },
    },
    {
      key: 'global_unique_clicks',
      name: 'Уникальные клики для всех кампаний',
      checked: true,
      data: [],
      view: { symbol: '', type: 'empty' },
    },
    {
      key: 'uc_campaign_rate',
      name: '% Уникальные клики для кампании',
      checked: true,
      data: [],
      view: { symbol: '%', type: 'percents' },
    },
    {
      key: 'uc_stream_rate',
      name: 'Уникальные клики для потока %',
      checked: true,
      data: [],
      view: { symbol: '%', type: 'percents' },
    },
    {
      key: 'uc_global_rate',
      name: 'Уникальные клики для всех кампаний %',
      checked: true,
      data: [],
      view: { symbol: '%', type: 'percents' },
    },
    { key: 'bots', name: 'Боты', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'bot_share', name: '% Бот', checked: true, data: [], view: { symbol: '%', type: 'percents' } },
    { key: 'proxies', name: 'Прокси', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'empty_referrers', name: 'Пуст. реф.', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'conversions', name: 'Конверсии', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'leads', name: 'Лиды', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'sales', name: 'Продажи', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'rejected', name: 'Отклоненные', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'rebills', name: 'Допродажи', checked: true, data: [], view: { symbol: '', type: 'empty' } },
    { key: 'approve', name: '% Аппрув', checked: true, data: [], view: { symbol: '%', type: 'percents' } },
    { key: 'cr', name: 'CR — коэфициент конверсии', checked: true, data: [], view: { symbol: '%', type: 'percents' } },
    {
      key: 'crs',
      name: 'CRs (продажи) — коэфициент конверсии',
      checked: true,
      data: [],
      view: { symbol: '%', type: 'percents' },
    },
    {
      key: 'crl',
      name: 'CR (лиды) — коэфициент конверсии',
      checked: true,
      data: [],
      view: { symbol: '%', type: 'percents' },
    },
    { key: 'roi', name: 'ROI (ожидаемый)', checked: true, data: [], view: { symbol: '%', type: 'percents' } },
    {
      key: 'roi_confirmed',
      name: 'ROI (подтвержденный)',
      checked: true,
      data: [],
      view: { symbol: '%', type: 'percents' },
    },
    {
      key: 'epc',
      name: 'EPC (ожидаемый) — доход с клика',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    {
      key: 'epc_confirmed',
      name: 'EPC (подтвержденный) — доход с клика',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    { key: 'cps', name: 'CPS — стоимость продажи', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    {
      key: 'cpa',
      name: 'CPA/CPL — стоимость привлечения',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    { key: 'cpc', name: 'CPС — стоимость клика', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'ecpc', name: 'eCPC — стоимость 1000 кликов', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    {
      key: 'ecpm',
      name: 'eCPM (ожидаемый) — прибыль с 1000 кликов',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    {
      key: 'ecpm_confirmed',
      name: 'eCPM (подтвержденный) — прибыль с 1000 кликов',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    {
      key: 'ec',
      name: 'EC (ожидаемый) — доход с конверсии',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    {
      key: 'ec_confirmed',
      name: 'EC (подтвержденный) — доход с конверсии',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },

    { key: 'profitability', name: 'Прибыльность', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'revenue', name: 'Доход', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'lead_revenue', name: 'Доход (ожид.)', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'sale_revenue', name: 'Доход (подтв.)', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'cost', name: 'Расход', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'profit', name: 'Прибыль (ожидаемая)', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    { key: 'rejected_revenue', name: 'Доход (отказы)', checked: true, data: [], view: { symbol: 'p', type: 'rub' } },
    {
      key: 'profit_confirmed',
      name: 'Прибыль (подтвержденная)',
      checked: true,
      data: [],
      view: { symbol: 'p', type: 'rub' },
    },
    {
      key: 'landing_clicked_period',
      name: 'Время проведенное на лендинге',
      checked: true,
      data: [],
      view: { symbol: '', type: 'str' },
    },
    { key: 'affiliate_network', name: 'Партнерская сеть', checked: true, data: [], view: { symbol: '', type: 'str' } },
    { key: 'country', name: 'Страна', checked: true, data: [], view: { symbol: '', type: 'str' } },
    { key: 'group', name: 'Группа', checked: true, data: [], view: { symbol: '', type: 'str' } },
    { key: 'notes', name: 'Заметки', checked: true, data: [], view: { symbol: '', type: 'str' } },
    { key: 'conversion_cap', name: 'Каппинг', checked: true, data: [], view: { symbol: '', type: 'str' } },
  ].filter(({ key }) => this.VIEW_DATA.includes(key));

  metricsAll = [];

  selectedFilters = [];

  columns = [];

  campaignOne = new FormGroup({
    start: new FormControl(moment()),
    end: new FormControl(moment()),
  });

  filters: {
    [key: string]: { filterValue: string | any; filterField?: string; type?: FilterType; source?: FilterSource };
  } = {
    period: { filterField: 'period', filterValue: 'range-date' },
  };

  _loading = false;

  source;

  teamList: any[] = [DefaultSelect];

  userList: any[] = [DefaultSelect];

  role = +localStorage.getItem('role');

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  displayedColumns = [];

  dataTable: IRowTable[] = [];

  isNeedBackendFilters = true;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @HostListener('window:beforeunload', ['$event'])
  unloadDashboard() {
    const data = {
      metrics: this.selectedFilters,
      filterPeriod: this.campaignOne.value,
      metricsForm: this.metrics.value,
      filters: this.filters,
    };
    localStorage.setItem(this.prefix, JSON.stringify(data));
  }

  get isAdminOrTeamLead() {
    return [this.auth.roles.admin, this.auth.roles.teamlead].includes(this.role);
  }

  get isTeamLead() {
    return [this.auth.roles.teamlead].includes(this.role);
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

  protected constructor(
    @Inject('prefix') protected prefix: string,
    @Inject('VIEW_DATA') private VIEW_DATA,
    protected cd: ChangeDetectorRef,
    protected auth: AuthService
  ) {}

  ngOnInit(): void {
    this.init();
  }

  ngOnDestroy() {
    this.unloadDashboard();
    // console.log(this.prefix);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  get loading() {
    return this._loading;
  }

  set loading(v) {
    this._loading = v;
    this.cd.detectChanges();
  }

  get activeSelectedFilters() {
    return this.selectedFilters.filter(({ checked }) => checked);
  }

  init() {
    this.loading = true;

    let dataFromStorage: any = localStorage.getItem(this.prefix);
    dataFromStorage = dataFromStorage ? JSON.parse(dataFromStorage) : [];

    this.filters = { ...this.filters, ...dataFromStorage.filters };
    this.selectedFilters = dataFromStorage?.metrics || this.metricsAllDefault;

    const metricsForm = dataFromStorage?.metricsForm;
    if (metricsForm) {
      this.metrics.patchValue(metricsForm);
    }

    const filterPeriod = dataFromStorage?.filterPeriod;
    if (filterPeriod) {
      this.campaignOne.patchValue({
        start: moment(filterPeriod.start),
        end: moment(filterPeriod.end),
      });
    }

    combineLatest(this.getMetrics(), this.getGrouped())
      .pipe(untilDestroyed(this))
      .subscribe(
        ([metrics, grouped]) => {
          this.setDefaultFilters(grouped[0][0].teamId, metrics);
          this.source = grouped ?? [];
          this.applyFilters();
          this.updateByFilters();
        },
        error => (this.loading = false)
      );
  }

  setDefaultFilters(teamId, metrics) {
    const team = (this.filters && this.filters['team']?.filterValue) || teamId;
    const user = (this.filters && this.filters['user']?.filterValue) || null;
    metrics = (this.filters && this.filters['metrics']?.filterValue) || metrics;

    if (this.isTeamLead || !this.filters?.team?.filterValue) {
      this.setFilter({ filterValue: team, filterField: 'team' });
      this.setFilter({ filterValue: user, filterField: 'user' });
    }
    this.setFilter({ filterValue: metrics, filterField: 'metrics' });
  }

  getMetrics() {
    return of([]);
  }
  getGrouped() {
    return of([]);
  }
  loadData(filteredDate, filters) {
    return of([]);
  }

  getTotal(key, type) {
    if (type === 'str') {
      return '';
    }
    let total = this.dataSource.filteredData.reduce((acc, cur) => acc + cur[key], 0);
    if (type === 'percents') {
      total = total / this.dataSource.filteredData.length;
    }
    return isNaN(total) || !isFinite(total) ? 0 : total.toFixed(2);
  }

  updateDate(date = '') {
    this.loading = true;
    const filteredDate = {
      startDate: formatDate(this.campaignOne.value.start, 'dd.MM.yyyy' + date, 'ru'),
      finishDate: formatDate(this.campaignOne.value.end, 'dd.MM.yyyy' + date, 'ru'),
      isTimeInterval: !!date,
    };
    if (!this.campaignOne.value.end || !this.campaignOne.value.start) return;

    const difference = date ? 0 : this.campaignOne.value.end.diff(this.campaignOne.value.start, 'days');
    const isNeedDays = difference > 6;
    this.setFilter({ filterValue: isNeedDays ? ReportGrouping.day : ReportGrouping.day_hour, filterField: 'grouping' });

    return this.getData(filteredDate).pipe(
      map((data: any[]) =>
        data.map(el => ({ ...el, timestamp: this.parseDate(el, isNeedDays) })).sort((a, b) => a.timestamp - b.timestamp)
      ),
      map((data: any[]) => {
        data = this.frontFilter(data);
        return this.setCharts(data);
      }),
      untilDestroyed(this)
    );
  }

  frontFilter(arr) {
    return arr;
  }

  parseDate(el, isNeedDays) {
    let date;
    if (isNeedDays) {
      date = new Date(el?.day);
    } else {
      const dateString = '' + el?.day_hour;
      date =
        dateString.length != 10
          ? 0
          : new Date(
              +dateString.substr(0, 4),
              +dateString.substr(4, 2) - 1,
              +dateString.substr(6, 2),
              +dateString.substr(8, 2)
            );
    }
    date = moment(date)?.utcOffset(0, true)?.valueOf() || 0;
    return date;
  }

  getData(filteredDate) {
    const selected = this.selectedFilters.map(({ key }) => key);
    const teamId = this.filters && this.filters['team']?.filterValue ? this.filters['team']?.filterValue : undefined;
    const filters: IFilter = {
      teamId,
      userIds: [],
      groupIds: [],
      metrics: selected || [],
      grouping: this.filters && this.filters['grouping']?.filterValue,
    };
    this.filters &&
      this.filters['user']?.filterValue &&
      filters.userIds.push(this.filters && this.filters['user']?.filterValue);
    return this.loadData(filteredDate, filters);
  }

  setCharts(chartData) {
    const getByKey = key => chartData.map(el => [el.timestamp, el[key]]);

    this.metricsAll = this.metricsAllDefault.map(el => ({ ...el, data: getByKey(el.key) }));

    const selected = this.selectedFilters.map(({ key }) => key);
    this.metricsAll = this.metricsAll.map(el => ({ ...el, checked: selected.includes(el.key) }));
    this.selectedFilters = this.metricsAll.filter(el => selected.includes(el.key));
    this.metrics.patchValue(this.selectedFilters);

    this.columns = this.selectedFilters.map(el => {
      return {
        columnDef: el.key,
        header: el.name,
        cell: (element: any) => `${element[el.key] ?? '-'}`,
        view: el.view,
      };
    });

    this.displayedColumns = this.columns.map(c => c.columnDef);
    this.dataSource.data = chartData.map(data => {
      let keys = this.displayedColumns;
      let obj = {} as any;
      keys.forEach(k => {
        obj[k] = data[k];
        obj.name = data.name;
        obj.offer_group_id = data.offer_group_id;
        obj.teamId = data.teamId;
        obj.userId = data.userId;
      });
      return obj;
    });
    this.displayedColumns.unshift('name');

    this.applyFilters();

    this.cd.detectChanges();
  }

  updMetrics() {
    this.selectedFilters = this.metrics.value.filter(({ checked }) => checked);
    this.isNeedBackendFilters = true;
  }

  setFilter(filter) {
    filter = {
      ...filter,
      type: filter?.type ?? this.FILTER_TYPE.EQUAL,
      source: filter?.source ?? this.FILTER_SOURCE.BACK,
    };

    this.filters = { ...this.filters, [filter.filterField]: { ...filter } };
    this.applyFilters();
  }

  updateByFilters() {
    const period = this.filters && this.filters['period']?.filterValue;

    if (!this.isNeedBackendFilters) {
      this.dataSource.filter = 'upd';
      return;
    }

    this.updateDate(period === 'range-dateTime' ? ' HH:mm' : '').subscribe(
      () => {
        this.loading = false;
        this.isNeedBackendFilters = false;
        this.dataSource.filter = 'upd';
      },
      error => {
        this.loading = false;
        this.isNeedBackendFilters = false;
        this.dataSource.filter = 'upd';
      }
    );
  }

  clearFilters() {
    this.filters = {
      period: { filterField: 'period', filterValue: 'range-date' },
    };
    this.campaignOne.patchValue({
      start: moment(),
      end: moment(),
    });
    this.selectedFilters = this.metricsAllDefault;

    localStorage.removeItem(this.prefix);

    this.isNeedBackendFilters = true;
    this.updateByFilters();
  }

  applyFilters() {
    if (!this.source?.length) return;

    const setTeamList = () => {
      this.teamList = [DefaultSelect];
      this.source?.forEach(el =>
        el.forEach(({ teamId }) => {
          let item = {
            id: teamId,
            name: teamId,
          };
          !some(this.teamList, item) && this.teamList.push(item);
        })
      );
      this.teamList?.sort();
    };
    const setUserList = () => {
      this.userList = [DefaultSelect];
      this.source.forEach(arr =>
        arr.forEach(el => {
          if (team === el.teamId) {
            let item = {
              id: el.id,
              name: el.username,
            };
            !some(this.userList, item) && this.userList.push(item);
          }
        })
      );
    };

    const team = this.filters && this.filters['team']?.filterValue;

    setTeamList();
    if (team) {
      setUserList();
    }

    this.dataSource.filterPredicate = (data, filter) => {
      return Object.keys(this.filters)
        .filter(filterKey => this.filters[filterKey].source === this.FILTER_SOURCE.FRONT)
        .every(filterKey => {
          const filterItem = this.filters[filterKey];
          const { filterValue } = this.filters[filterKey];

          const filterType: FilterType = this.filters[filterKey].type;

          const dataStr = Object.keys(data)
            .filter(key => {
              if (filterItem.filterField === 'all') {
                return true;
              }
              return filterItem.filterField === key;
            })
            .filter(key => {
              const currentValue = data[key];
              if (filterType === this.FILTER_TYPE.ALL) {
                return true;
              }
              if (filterType === this.FILTER_TYPE.EQUAL) {
                return filterValue === '' ? true : currentValue === filterValue;
              }
              if (filterType === this.FILTER_TYPE.GRATE_THAN) {
                return currentValue > filterValue;
              }
              if (filterType === this.FILTER_TYPE.LESS_THAN) {
                return currentValue < filterValue;
              }
            })
            .reduce((currentTerm, key) => {
              return currentTerm + data[key] + '◬';
            }, '')
            .toLowerCase();
          const transformedFilter = isString(filterItem.filterValue)
            ? filterItem.filterValue.trim().toLowerCase()
            : filterItem.filterValue;
          return dataStr.indexOf(transformedFilter) != -1;
        });
    };

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    this.cd.detectChanges();
  }
}
