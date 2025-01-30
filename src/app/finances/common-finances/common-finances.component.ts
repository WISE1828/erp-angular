import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';
import { uniq } from 'lodash';
import * as moment from 'moment';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import {
  ControlType,
  DataTable,
  FilterOptions,
  FilterTarget,
  FilterType,
  ValueType,
} from '../../shared/components/data-table/data-table.models';
import { oldTableBeforeDate } from '../../shared/constants';
import { parseNumberWithPrefix } from '../../shared/helpers';
import { IFilters } from '../../shared/interfaces/filter.interface';
import { checkNumber } from '../../shared/math/formulas.base';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UserInfoService } from '../../shared/services/user-info.service';
import { WorkPerformanceService } from '../../shared/services/work-performance.service';
import { FinancesService, ICommonDailyRoiItem } from '../finances.service';

@UntilDestroy()
@Component({
  selector: 'app-common-finances',
  templateUrl: './common-finances.component.html',
  styleUrls: ['./common-finances.component.scss', '../finances.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonFinancesComponent implements OnInit {
  public roles = this.auth.rolesListView;
  commonBudgets = [];
  public filters: IFilters;
  public form: FormGroup;
  public currentItems: ICommonDailyRoiItem[];
  public loading = false;
  public role: number;
  public teamId: number;
  public activities = [
    { label: 'Не выбрано', id: '' },
    { label: 'Активен', id: 'true' },
    { label: 'Заблокирован', id: 'false' },
  ];
  public remotes = [
    { label: 'Не выбрано', id: '' },
    { label: 'Да', id: 'true' },
    { label: 'Нет', id: 'false' },
  ];
  teams = new Subject();
  users = new Subject();

  queryParams: Params;
  startDate: moment.Moment;
  finishDate: moment.Moment;

  constructor(
    private notificationService: NotificationService,
    private financesService: FinancesService,
    private auth: AuthService,
    public userInfoService: UserInfoService,
    public router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private workPerformanceService: WorkPerformanceService
  ) {}

  parseDataById(data) {
    if (data) {
      this.currentItems = data;
    }
  }

  refreshDate() {
    this.queryParams = this.route.snapshot.queryParams;
    this.startDate = moment(this.queryParams.startDate.split('@')[0], 'DD.MM.YYYY');
    this.finishDate = moment(this.queryParams.endDate.split('@')[0], 'DD.MM.YYYY');
  }

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.teamId = +localStorage.getItem('teamId');
    this.setDataTable();

    // this.refreshDate();

    // if ((this.isAdmin || this.isFinancier) && this.startDate.isBefore(oldTableBeforeDate)) {
    //   this.setDataTableOld();
    // } else {
    //   this.setDataTable();
    // }
  }

  filtersAndDateChange(value: any): void {
    if (!this.activeFilers[0]) {
      this.activeFilers = value;
    }

    console.log(this.activeFilers[0].control.value.startDate);
    console.log(value[0].control.value.startDate);

    if (
      !this.activeFilers[0].control.value.startDate.isSame(value[0].control.value.startDate) ||
      !this.activeFilers[0].control.value.endDate.isSame(value[0].control.value.endDate)
    ) {
      this.refreshDate();

      if ((this.isAdmin || this.isFinancier) && this.startDate.isBefore(oldTableBeforeDate)) {
        this.setDataTableOld();
      } else {
        this.setDataTable();
      }
    }

    this.activeFilers = value;
  }

  public get isAdmin(): boolean {
    return this.role === this.auth.roles.admin;
  }

  public get isFinancier(): boolean {
    return this.role === this.auth.roles.admin;
  }

  public get isTeamLead(): boolean {
    return this.role === this.auth.roles.teamlead;
  }

  loadBudgets(date) {
    return this.workPerformanceService.getList(date).pipe(
      map(data => {
        this.commonBudgets = data?.reduce((acc, cur) => {
          const item = cur.personalBudgets.map(el => ({ ...el, teamId: cur.teamId }));
          acc = acc.concat(...item);
          return acc;
        }, []);
      }),
      tap(() => this.cd.detectChanges()),
      catchError(() => {
        return null;
      })
    );
  }
  get budgetValue() {
    const flattenData = this.commonBudgets?.filter(({ userId, teamId }) => {
      if (isNotNullOrUndefined(userId)) {
        return this.currentItems?.findIndex(el => el.userId === userId) != -1;
      }
      if (isNotNullOrUndefined(teamId)) {
        return this.currentItems?.findIndex(el => el.teamId === teamId) != -1;
      }
      return true;
    });
    return flattenData?.reduce((acc, { budget }) => acc + (budget || 0), 0);
  }

  // SHARED
  public goToDaily(id: string): void {
    {
      const params = Object.keys(this.route.snapshot.queryParams).reduce((acc, key) => {
        const filter = this.route.snapshot.queryParams[key];
        acc[key] = filter;
        if (filter.includes(FilterTarget.FRONT)) {
          acc[key] += FilterOptions.SKIP;
        }
        return acc;
      }, {});
      this.router.navigate(['/daily', id], {
        queryParams: { ...params, return: 'yes' },
      });
    }
  }

  daysInMonth(anyDateInMonth: Date | any) {
    return new Date(anyDateInMonth.getFullYear(), anyDateInMonth.getMonth() + 1, 0).getDate();
  }

  now = new Date(2024, 9, 0).getDate();

  // TABLE
  get totalComissionTax() {
    // let t = new Date(this.dataTableInstance.dataSource._data._value[0].date);
    // let dayInCurrentMonth = this.daysInMonth(t);

    // let dayInCurrentMonth = this.now;

    // for (let i = 0; i < this.currentItems.length; i++) {
    //   const dailyIncrease = this.currentItems[i].comissionTax / dayInCurrentMonth;
    //   const dailyIncreaseUSD = this.currentItems[i].comissionTaxUsd / dayInCurrentMonth;

    //   if (dailyIncrease === 0 && dailyIncreaseUSD === 0) {
    //     continue;
    //   }

    //   const goneDays = this.currentItems[i].comissionTax / dailyIncrease;
    //   const goneDaysUSD = this.currentItems[i].comissionTaxUsd / dailyIncreaseUSD;

    //   const needToAdd = dayInCurrentMonth - goneDays;
    //   const needToAddUSD = dayInCurrentMonth - goneDaysUSD;

    //   this.currentItems[i].comissionTax = this.currentItems[i].comissionTax + needToAdd * dailyIncrease;
    //   this.currentItems[i].comissionTaxUsd = this.currentItems[i].comissionTaxUsd + needToAddUSD * dailyIncreaseUSD;
    // }

    return this.currentItems?.reduce((acc, { comissionTax }) => comissionTax + acc, 0);
  }
  get totalComissionTaxUSD() {
    return this.currentItems?.reduce((acc, { comissionTaxUsd }) => comissionTaxUsd + acc, 0);
  }
  get totalComission() {
    return this.currentItems?.reduce((acc, { comission }) => comission + acc, 0);
  }
  get totalAccountTax() {
    return this.currentItems?.reduce((acc, { accountTax }) => accountTax + acc, 0);
  }
  get totalAccountTaxUSD() {
    return this.currentItems?.reduce((acc, { accountTaxUsd }) => accountTaxUsd + acc, 0);
  }
  get totalConsumables(): number {
    return (
      this.currentItems?.reduce((acc, { meta: { consumables }, accountTax }) => consumables + accountTax + acc, 0) || 0
    );
  }
  get totalConsumablesUSD(): number {
    return (
      this.currentItems?.reduce(
        (acc, { meta: { consumablesUSD }, accountTaxUsd }) => consumablesUSD + accountTaxUsd + acc,
        0
      ) || 0
    );
  }
  get totalIncome(): number {
    return this.currentItems?.reduce((acc, { meta: { incomeRUB } }) => incomeRUB + acc, 0) || 0;
  }
  get totalIncomeUSD(): number {
    return this.currentItems?.reduce((acc, { meta: { incomeUSD } }) => incomeUSD + acc, 0) || 0;
  }
  get totalIncomeEUR(): number {
    return this.currentItems?.reduce((acc, { meta: { incomeEUR } }) => incomeEUR + acc, 0) || 0;
  }
  get totalSpent(): number {
    let value = null;
    this.currentItems?.forEach(el => {
      value = value + el.meta.spent + el.comissionTax;
    });
    return value || 0;
  }
  get totalSpentUSD(): number {
    let value = null;
    this.currentItems?.forEach(el => {
      value = value + el.meta.spentUSD + el.comissionTaxUsd;
    });
    return value || 0;
  }
  get totalProfitWithCommission() {
    return this.currentItems?.reduce((acc, el) => acc + el.meta.profitWithComission, 0) || 0;
  }
  get avrUSD() {
    return this.currentItems?.reduce((a, c) => a + c.meta.usdRub, 0) / this.currentItems?.length || 0;
  }
  get avrEUR() {
    return this.currentItems?.reduce((a, c) => a + c.meta.eurRub, 0) / this.currentItems?.length || 0;
  }
  get consumablesToRub() {
    return this.totalConsumables + this.totalConsumablesUSD * this.avrUSD;
  }
  get spendsToRub() {
    return this.totalSpent + this.totalSpentUSD * this.avrUSD;
  }
  get incomeToRub() {
    return this.totalIncome + this.totalIncomeUSD * this.avrUSD + this.totalIncomeEUR * this.avrEUR;
  }

  // FORMULAS
  get income() {
    // Сюда не тяну incomeToRub - так как бек отдает уже вычисленный профит для common
    return this.totalProfitWithCommission;
  }
  get expose() {
    return this.spendsToRub + this.consumablesToRub;
  }
  get getTotalRoi(): number {
    return checkNumber((this.getTotalProfit / this.expose) * 100, 0);
  }
  get getTotalProfit(): number {
    const expose = 0; // Сюда не тяну this.expose - так как бек отдает уже вычисленный профит для common
    return this.income - expose || 0;
  }
  get getResultMoney(): number {
    let result = 0;
    this.currentItems?.forEach(el => {
      result = result + el.meta.clearProfit;
    });
    return result || 0;
  }

  get differenceDate() {
    // const start = periodFromRegDate(this.activeFilers[0]?.control?.value["startDate"]) // need delete
    const start = this.activeFilers[0]?.control?.value['startDate'];
    const end = this.activeFilers[0]?.control?.value['endDate'];
    if (!start || !end) {
      return undefined;
    }
    return moment.duration(end.diff(start));
  }

  // TABLE
  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.cellContent = changes?.content;
  }
  public cellContent: any = {};
  public activeFilers = {};
  public dataTableConfig: DataTable<any>;
  tableMappedItems(items) {
    return items.map(item => ({
      ...item,
      userId: item.userId,
      userName: item.userName,
      isActive: item?.isActive,
      isRemote: item?.isRemote,
      userRoleId: item.userRoleId,
      roleName: item.userRoleId === 1 ? 'Админ.' : this.auth.rolesRU[item.userRoleId],
      teamId: item.teamId,
      spent: item.meta.spent,
      spentUSD: item.meta.spentUSD,
      consumables: item.meta.consumables,
      consumablesUSD: item.meta.consumablesUSD,
      incomeRUB: item.meta.incomeRUB,
      incomeUSD: item.meta.incomeUSD,
      incomeEUR: item.meta.incomeEUR,
      profit: item.meta.profit,
      roi: item.meta.roi,
      meta: item.meta,
      actions: true,
    }));
  }
  setDataTable() {
    this.dataTableConfig = {
      tableName: 'commonFinances',
      displayColumns: [
        'userId',
        'userName',
        'roleName',
        'teamId',
        'spent',
        'consumables',
        'incomeRUB',
        'minusPeriod',
        'unpaidTraffic',
        'slices',
        'includingMonth',
        'includingMinus',
        'actions',
      ],
      displayFooter: [
        'teamId',
        'spent',
        'consumables',
        'incomeRUB',
        'minusPeriod',
        'unpaidTraffic',
        'slices',
        'includingMonth',
        'includingMinus',
        'actions',
      ],
      filters: [
        {
          label: 'Период',
          direction: FilterTarget.BACK,
          control: {
            value: {
              // startDate:
              //   localStorage.getItem('role') === '12'
              //     ? moment(localStorage.getItem('created_at')).startOf('month').toDate()
              //     : moment().startOf('month').toDate(),
              // endDate: moment(),

              startDate: this.startDate ? moment(this.startDate, 'DD.MM.YYYY') : moment().startOf('month'),
              endDate: this.finishDate ? moment(this.finishDate, 'DD.MM.YYYY') : moment(),
            },
            name: 'period',
            type: ControlType.DATE_PERIOD,
            valueType: ValueType.OBJECT,
          },
        },
        {
          label: 'Роль',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'userRoleId',
            source: of(this.roles.slice(1).map(({ id, name }) => ({ id, label: name }))),
          },
        },
        {
          label: 'Пользователь',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'userId',
            source: this.users,
          },
        },
        {
          label: 'Команда',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'teamId',
            source: this.teams,
          },
        },
        {
          label: 'Активность',
          direction: FilterTarget.FRONT,
          types: FilterType.EQUAL,
          control: {
            valueType: ValueType.BOOLEAN,
            value: '',
            name: 'isActive',
            type: ControlType.SELECT,
            source: of(this.activities),
          },
        },
        {
          label: 'Удалённая работа',
          direction: FilterTarget.FRONT,
          types: FilterType.EQUAL,
          control: {
            valueType: ValueType.BOOLEAN,
            value: '',
            name: 'isRemote',
            type: ControlType.SELECT,
            source: of(this.remotes),
          },
        },
      ],
      cells: [
        {
          matColumnDef: 'userId',
          header: {
            label: 'ID',
            classes: { 'w-50': true },
          },
          cell: {
            calculated: el => el.userId,
            classes: { 'w-50': true },
          },
        },
        {
          matColumnDef: 'userName',
          header: {
            label: 'Пользователь',
            classes: { 'w-150': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.userLinkElement,
              contextCalculated: el => ({
                redirectUrl: `/profile/${el.userId}`,
                userName: `${el.userName}${el?.isRemote ? ' (N)' : ''}`,
                isActive: el.isActive,
              }),
            },
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'roleName',
          header: {
            label: 'Роль',
            classes: { 'w-70': true },
          },
          cell: {
            calculated: el => el.roleName,
            classes: { 'w-70': true },
          },
        },
        {
          matColumnDef: 'teamId',
          header: {
            label: 'Команда',
            classes: { 'w-60': true },
          },
          cell: {
            calculated: el => el.teamId,
            classes: { 'w-60': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: '',
                  },
                  {
                    label: 'Итого',
                    styles: { borderLeft: '1px solid #d1d1d1' },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            styles: { color: '#e3b04e' },
            classes: { 'w-200': true, 'm-l-150': true },
          },
        },

        {
          matColumnDef: 'spent',
          header: {
            label: 'Потрачено',
            // content: {
            //   templateCalculated: () => this.cellContent.itemsContainer,
            //   contextCalculated: () => ({
            //     items: [
            //       // {
            //       //   label: '₽',
            //       //   styles: { borderTop: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //       // {
            //       //   label: '$',
            //       //   styles: { borderTop: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //     ],
            //   }),
            // },
            classes: { 'w-100': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  // {
                  //   label: parseNumberWithPrefix(el.spent, '₽'),
                  //   classes: { 'w-100': true },
                  // },
                  {
                    label: parseNumberWithPrefix(el.spentUSD, '$'),
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            styles: { backgroundColor: '#f3dcdc' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        // items: [
                        //   // {
                        //   //   label: parseNumberWithPrefix(this.totalComissionTax, '₽'),
                        //   //   styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                        //   // },
                        //   // {
                        //   //   label: parseNumberWithPrefix(this.totalComissionTaxUSD, '$'),
                        //   //   styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                        //   // },
                        // ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          // {
                          //   label: parseNumberWithPrefix(this.totalSpent, '₽'),
                          //   styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          // },
                          {
                            label: parseNumberWithPrefix(this.totalSpentUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-90': true },
          },
        },
        {
          matColumnDef: 'consumables',
          header: {
            label: '',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: 'Комиссия',
                    // styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: 'Расходники',
                    // styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-150': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.comission, '$'),
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.consumablesUSD, '$'),
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            styles: { backgroundColor: '#f4e1e5' },
            classes: { 'w-150': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          // {
                          //   label: parseNumberWithPrefix(this.totalComission, 'Др'),
                          //   styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          // },
                          // {
                          //   label: parseNumberWithPrefix(this.totalAccountTaxUSD, 'Др'),
                          //   styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          // },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalComission, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalConsumablesUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'incomeRUB',
          header: {
            label: 'Доход',
            // content: {
            //   templateCalculated: () => this.cellContent.itemsContainer,
            //   contextCalculated: () => ({
            //     items: [
            //       // {
            //       //   label: '₽',
            //       //   styles: { borderTop: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //       // {
            //       //   label: '$',
            //       //   styles: { borderTop: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //       // {
            //       //   label: '€',
            //       //   styles: { borderTop: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //     ],
            //   }),
            // },
            classes: { 'w-100': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  // {
                  //   label: parseNumberWithPrefix(el.incomeRUB, '₽'),
                  //   classes: { 'w-100': true },
                  // },
                  {
                    label: parseNumberWithPrefix(el.incomeUSD, '$'),
                    classes: { 'w-100': true },
                  },
                  // {
                  //   label: parseNumberWithPrefix(el.incomeEUR, '€'),
                  //   classes: { 'w-100': true },
                  // },
                ],
              }),
            },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          // {
                          //   label: parseNumberWithPrefix(this.totalIncome, '₽'),
                          //   styles: { borderBottom: 'none' },
                          // },
                          {
                            label: parseNumberWithPrefix(this.totalIncomeUSD, '$'),
                            styles: { borderBottom: 'none' },
                          },
                          // {
                          //   label: parseNumberWithPrefix(this.totalIncomeEUR, '€'),
                          //   styles: { borderBottom: 'none' },
                          // },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'minusPeriod',
          header: {
            label: 'Минус прошлого периода',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.profit, '$'),
            // styles: { backgroundColor: '#d5ebd5' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfit, '$'),
                            styles: { borderLeft: '1px solid #d1d1d1' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'unpaidTraffic',
          header: {
            label: 'Неоплаченный трафик',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.profit, '$'),
            // styles: { backgroundColor: '#d5ebd5' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfit, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'slices',
          header: {
            label: 'Срезы',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.profit, '$'),
            // styles: { backgroundColor: '#d5ebd5' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfit, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'includingMonth',
          header: {
            label: 'Внутри месяца',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: 'Профит',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: 'ROI',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-100': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.profit, '$'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#d5ebd5' },
                  },
                  {
                    label: parseNumberWithPrefix(el.roi, '%'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#dedede' },
                  },
                ],
              }),
            },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.getTotalProfit, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.getTotalRoi, '%'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'includingMinus',
          header: {
            label: 'С учетом минуса',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: 'Профит',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: 'ROI',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-100': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.profit, '$'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#d5ebd5' },
                  },
                  {
                    label: parseNumberWithPrefix(el.roi, '%'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#dedede' },
                  },
                ],
              }),
            },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.getTotalProfit, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.getTotalRoi, '%'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'w-50': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.eyeElement,
              contextCalculated: el => ({ action: () => this.goToDaily(el.userId) }),
            },
            classes: { 'hide-border': true, 'w-50': true },
          },
          footer: {
            styles: { display: 'none' },
            classes: { 'w-50': true },
          },
        },
      ],
      crudAPI: {
        list: ({
          // startDate = moment().startOf('month').format('DD.MM.YYYY'),
          // endDate = moment().format('DD.MM.YYYY'),

          startDate = (this.startDate ? moment(this.startDate, 'DD.MM.YYYY') : moment().startOf('month')).format(
            'DD.MM.YYYY'
          ),
          endDate = (this.finishDate ? moment(this.finishDate, 'DD.MM.YYYY') : moment()).format('DD.MM.YYYY'),
        }) => {
          return combineLatest(
            this.loadBudgets(startDate),
            this.financesService.getCommonDailyRoies(startDate, endDate)
          ).pipe(
            map(([, finances]) => {
              return finances?.dailyRoiGroupStatisticDtos;
            }),
            tap(data => {
              this.currentItems = data;
              const teams = uniq(data.map(el => el.teamId))
                .sort()
                .map(el => ({ id: el, label: el }));
              const users = uniq(
                data.map(el => ({ id: el.userId, label: `(${el.userId}) ${el.userName}` }))
              ).sort((a, b) => a.label.localeCompare(b.label));
              this.teams.next(teams);
              this.users.next(users);
            }),
            map(items => this.tableMappedItems(items))
          );
        },
      },
      rowConfig: {
        header: {
          sticky: true,
        },
        footer: {
          sticky: true,
          styles: { marginTop: '50px' },
        },
      },
    };
  }

  setDataTableOld() {
    this.dataTableConfig = {
      tableName: 'commonFinances',
      displayColumns: [
        'userId',
        'userName',
        'roleName',
        'teamId',
        'spent',
        'consumables',
        'incomeRUB',
        'profit',
        'roi',
        'actions',
      ],
      displayFooter: ['teamId', 'spent', 'consumables', 'incomeRUB', 'profit', 'roi', 'actions'],
      filters: [
        {
          label: 'Период',
          direction: FilterTarget.BACK,
          control: {
            value: {
              // startDate:
              //   localStorage.getItem('role') === '12'
              //     ? moment(localStorage.getItem('created_at')).startOf('month').toDate()
              //     : moment().startOf('month').toDate(),
              // endDate: moment(),

              startDate: this.startDate ? moment(this.startDate, 'DD.MM.YYYY') : moment().startOf('month'),
              endDate: this.finishDate ? moment(this.finishDate, 'DD.MM.YYYY') : moment(),
            },
            name: 'period',
            type: ControlType.DATE_PERIOD,
            valueType: ValueType.OBJECT,
          },
        },
        {
          label: 'Роль',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'userRoleId',
            source: of(this.roles.slice(1).map(({ id, name }) => ({ id, label: name }))),
          },
        },
        {
          label: 'Пользователь',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'userId',
            source: this.users,
          },
        },
        {
          label: 'Команда',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'teamId',
            source: this.teams,
          },
        },
        {
          label: 'Активность',
          direction: FilterTarget.FRONT,
          types: FilterType.EQUAL,
          control: {
            valueType: ValueType.BOOLEAN,
            value: '',
            name: 'isActive',
            type: ControlType.SELECT,
            source: of(this.activities),
          },
        },
        {
          label: 'Удалённая работа',
          direction: FilterTarget.FRONT,
          types: FilterType.EQUAL,
          control: {
            valueType: ValueType.BOOLEAN,
            value: '',
            name: 'isRemote',
            type: ControlType.SELECT,
            source: of(this.remotes),
          },
        },
      ],
      cells: [
        {
          matColumnDef: 'userId',
          header: {
            label: 'ID',
            classes: { 'w-50': true },
          },
          cell: {
            calculated: el => el.userId,
            classes: { 'w-50': true },
          },
        },
        {
          matColumnDef: 'userName',
          header: {
            label: 'Пользователь',
            classes: { 'w-150': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.userLinkElement,
              contextCalculated: el => ({
                redirectUrl: `/profile/${el.userId}`,
                userName: `${el.userName}${el?.isRemote ? ' (N)' : ''}`,
                isActive: el.isActive,
              }),
            },
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'roleName',
          header: {
            label: 'Роль',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => el.roleName,
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'teamId',
          header: {
            label: 'Команда',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => el.teamId,
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: 'Комиссия/Расходники*',
                  },
                  {
                    label: 'Итого',
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            styles: { color: '#e3b04e' },
            classes: { 'w-200': true, 'm-l-150': true },
          },
        },

        {
          matColumnDef: 'spent',
          header: {
            label: 'Потрачено',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: '₽',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '$',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.spent, '₽'),
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.spentUSD, '$'),
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            styles: { backgroundColor: '#f3dcdc' },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalComissionTax, '₽'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalComissionTaxUSD, '$'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                          },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalSpent, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalSpentUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'consumables',
          header: {
            label: 'Расходники',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: '₽',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '$',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.consumables, '₽'),
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.consumablesUSD, '$'),
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            styles: { backgroundColor: '#f4e1e5' },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalAccountTax, '₽'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalAccountTaxUSD, '$'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalConsumables, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalConsumablesUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'incomeRUB',
          header: {
            label: 'Доход',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    label: '₽',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '$',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '€',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-300': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.incomeRUB, '₽'),
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.incomeUSD, '$'),
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.incomeEUR, '€'),
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-300': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalIncome, '₽'),
                            styles: { borderBottom: 'none' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalIncomeUSD, '$'),
                            styles: { borderBottom: 'none' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalIncomeEUR, '€'),
                            styles: { borderBottom: 'none' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-300': true },
          },
        },

        {
          matColumnDef: 'profit',
          header: {
            label: 'Профит',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.profit, '₽'),
            styles: { backgroundColor: '#d5ebd5' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfit, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'roi',
          header: {
            label: 'ROI',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.roi, '%'),
            styles: { backgroundColor: '#dedede' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: () => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: () => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalRoi, '%'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },

        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'w-50': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.eyeElement,
              contextCalculated: el => ({ action: () => this.goToDaily(el.userId) }),
            },
            classes: { 'hide-border': true, 'w-50': true },
          },
          footer: {
            styles: { display: 'none' },
            classes: { 'w-50': true },
          },
        },
      ],
      crudAPI: {
        list: ({
          // startDate = moment().startOf('month').format('DD.MM.YYYY'),
          // endDate = moment().format('DD.MM.YYYY'),

          startDate = (this.startDate ? moment(this.startDate, 'DD.MM.YYYY') : moment().startOf('month')).format(
            'DD.MM.YYYY'
          ),
          endDate = (this.finishDate ? moment(this.finishDate, 'DD.MM.YYYY') : moment()).format('DD.MM.YYYY'),
        }) => {
          return combineLatest(
            this.loadBudgets(startDate),
            this.financesService.getCommonDailyRoies(startDate, endDate)
          ).pipe(
            map(([, finances]) => {
              return finances?.dailyRoiGroupStatisticDtos;
            }),
            tap(data => {
              this.currentItems = data;
              const teams = uniq(data.map(el => el.teamId))
                .sort()
                .map(el => ({ id: el, label: el }));
              const users = uniq(
                data.map(el => ({ id: el.userId, label: `(${el.userId}) ${el.userName}` }))
              ).sort((a, b) => a.label.localeCompare(b.label));
              this.teams.next(teams);
              this.users.next(users);
            }),
            map(items => this.tableMappedItems(items))
          );
        },
      },
      rowConfig: {
        header: {
          sticky: true,
        },
        footer: {
          sticky: true,
          styles: { marginTop: '50px' },
        },
      },
    };
  }
}
