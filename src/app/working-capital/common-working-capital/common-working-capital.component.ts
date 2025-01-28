import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  ICommonWorkingCapital,
  ICommonWorkingCapitalTeamLead,
  IRemains,
  WorkingCapitalService,
} from '../../shared/services/working-capital';
import { UserInfoService } from '../../shared/services/user-info.service';
import { FormControl, FormGroup } from '@angular/forms';
import { NotificationService } from '../../shared/services/notification.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, map, tap } from 'rxjs/operators';
import {
  ControlType,
  DataTable,
  FilterOptions,
  FilterTarget,
  FilterType,
  ValueType,
} from '../../shared/components/data-table/data-table.models';
import { ICommonAccountRequest } from '../../shared/services/account-request.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { of, Subject } from 'rxjs';
import { parseNumber } from '../../shared/helpers';
import { uniq } from 'lodash';

export const MY_FORMATS = {
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
  selector: 'app-common-working-capital',
  templateUrl: './common-working-capital.component.html',
  styleUrls: ['./common-working-capital.component.scss', '../working-capital.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonWorkingCapitalComponent implements OnInit {
  public form: FormGroup;
  public remainsForm: FormGroup = new FormGroup({
    factRemainsUsd: new FormControl(0, []),
    factRemainsRub: new FormControl(0, []),
    needRemainsUsd: new FormControl(0, []),
    needRemainsRub: new FormControl(0, []),
  });
  public roles = this.auth.rolesListView;
  public loading = true;
  public columns: number[];
  public commonWorkingCapitalData: ICommonWorkingCapital[];
  public commonWorkingCapitalDataTeamLead: ICommonWorkingCapitalTeamLead;
  public currentItems: ICommonWorkingCapital[];
  public paymentInfoTypes = this.userInfoService.paymentInfoTypes;
  public formatedDate: string;
  role = +localStorage.getItem('role');
  teams = new Subject();

  constructor(
    private workingCapitalService: WorkingCapitalService,
    public userInfoService: UserInfoService,
    private notificationService: NotificationService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setDataTable();
  }

  get isAdmin() {
    return [this.auth.roles.admin, this.auth.roles.financier].includes(this.role);
  }
  get isTeamLead() {
    return [this.auth.roles.teamlead].includes(this.role);
  }

  public setWorkingCapitalData(date: string) {
    this.loading = true;

    const action = this.isAdmin
      ? this.workingCapitalService.getCommonWorkingCapitalData(date)
      : this.workingCapitalService.getCommonWorkingCapitalMonthForTeamlead(date).pipe(
          tap(data => {
            this.commonWorkingCapitalDataTeamLead = data;
            const item = {
              factRemainsUsd: data?.commandRemainsFact?.usd || 0,
              factRemainsRub: data?.commandRemainsFact?.rub || 0,
              needRemainsUsd: data?.commandRemainsNeed?.usd || 0,
              needRemainsRub: data?.commandRemainsNeed?.rub || 0,
            };
            this.remainsForm.patchValue(item);
          }),
          map(({ workingCapitalCommonResponses }) => workingCapitalCommonResponses)
        );

    return action.pipe(
      tap(response => {
        this.loading = false;
        this.commonWorkingCapitalData = response;
        this.currentItems = response;

        const teams = uniq(response.map(el => el.teamId))
          .sort()
          .map(el => ({ id: el, label: el }));
        this.teams.next(teams);

        this.columns = this.commonWorkingCapitalData[0].paymentInfoDailiesMerged.map(el => el.paymentInfoType);
        this.fillUserPayments();
        this.cd.detectChanges();
      }),
      catchError(err => {
        this.commonWorkingCapitalData = null;
        this.currentItems = null;
        this.loading = false;
        this.dataTableInstance.stopLoading();
        this.notificationService.showMessage('error', 'При получении данных произошла ошибка');
        this.cd.detectChanges();
        return err;
      }),
      untilDestroyed(this)
    );
  }

  public getTotalData(items): number {
    return items.reduce((acc, cur) => acc + cur || 0, 0);
  }

  get totalComission(): number {
    const commissionWithoutNull = this.currentItems?.filter(({ comission }) => comission > 0) || [];
    const summ = commissionWithoutNull.reduce((acc, item) => {
      return acc + item.comission;
    }, 0);
    const result = summ / commissionWithoutNull.length;
    return isFinite(result) ? result : 0;
  }

  private fillUserPayments(): void {
    this.currentItems.forEach(item => {
      this.paymentInfoTypes.forEach(type => {
        const payment = item.paymentInfoDailiesMerged.find(el => el.paymentInfoType === +type.paymentInfoType);
        if (!payment) {
          const emptyPayment = {
            paymentInfoType: +type.paymentInfoType,
            value: 0,
            currency: type.currency,
          };
          item.paymentInfoDailiesMerged.push(emptyPayment);
        }
      });
      item.paymentInfoDailiesMerged.sort((a, b) => {
        return a.paymentInfoType - b.paymentInfoType;
      });
    });
  }

  get remainsFactView() {
    return this.remainsForm.get('factRemainsRub').value + ' ₽ / ' + this.remainsForm.get('factRemainsUsd').value + ' $';
  }
  get remainsFactItems() {
    return [
      { name: 'factRemainsRub', value: this.remainsForm.get('factRemainsRub').value, postfix: '₽' },
      { name: 'factRemainsUsd', value: this.remainsForm.get('factRemainsUsd').value, postfix: '$' },
    ];
  }

  get remainsNeedView() {
    return this.remainsForm.get('needRemainsRub').value + ' ₽ / ' + this.remainsForm.get('needRemainsUsd').value + ' $';
  }
  get remainsNeedItems() {
    return [
      { name: 'needRemainsRub', value: this.remainsForm.get('needRemainsRub').value, postfix: '₽' },
      { name: 'needRemainsUsd', value: this.remainsForm.get('needRemainsUsd').value, postfix: '$' },
    ];
  }

  public saveCommandRemains({ factRemainsUsd, factRemainsRub, needRemainsUsd, needRemainsRub }): void {
    this.loading = true;
    const item: IRemains = {
      remainsFact: {
        usd: factRemainsUsd || this.remainsForm.get('factRemainsUsd').value,
        rub: factRemainsRub || this.remainsForm.get('factRemainsRub').value,
      },
      remainsNeed: {
        usd: needRemainsUsd || this.remainsForm.get('needRemainsUsd').value,
        rub: needRemainsRub || this.remainsForm.get('needRemainsRub').value,
      },
    };

    const termId = this.commonWorkingCapitalDataTeamLead?.termId || 6;
    this.workingCapitalService
      .saveCommandRemains(item, +termId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          const itemUpdated = {
            factRemainsUsd: item.remainsFact.usd,
            factRemainsRub: item.remainsFact.rub,
            needRemainsUsd: item.remainsNeed.usd,
            needRemainsRub: item.remainsNeed.rub,
          };
          this.remainsForm.patchValue(itemUpdated);
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При обновлении данных произошла ошибка');
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }

  // TABLE
  public cellContent: any = {};
  public dataTableConfig: DataTable<ICommonAccountRequest>;
  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.dataTableInstance = changes;
    this.cellContent = changes?.content;
  }
  dataTableInstance;

  findByType(type, items) {
    const elemFromDictionary = this.userInfoService.paymentInfoTypes.find(
      ({ paymentInfoType }) => +paymentInfoType === type
    );
    const elemFromServer = items.find(({ paymentInfoType }) => paymentInfoType === type);
    return { ...elemFromDictionary, ...elemFromServer };
  }

  private tableMappedItems(items) {
    return items.map(item => ({
      comission: item.comission,
      unhandledMoneyRequestCount: item?.unhandledMoneyRequestCount,
      userRoleId: item.roleId,
      teamId: item.teamId,
      userId: item.userId,
      userName: item.username,
      qiwi: this.findByType(1, item.paymentInfoDailiesMerged),
      wm: this.findByType(2, item.paymentInfoDailiesMerged),
      bank_rub: this.findByType(3, item.paymentInfoDailiesMerged),
      money_rub: this.findByType(4, item.paymentInfoDailiesMerged),
      bank_usd: this.findByType(5, item.paymentInfoDailiesMerged),
      money_usd: this.findByType(6, item.paymentInfoDailiesMerged),
      actions: true,
    }));
  }
  private setDataTable() {
    this.dataTableConfig = {
      tableName: 'commonWorkingCapital',
      displayColumns: [
        'userId',
        'userName',
        'qiwi',
        'wm',
        'bank_rub',
        'money_rub',
        'bank_usd',
        'money_usd',
        'comission',
        'actions',
      ],
      displayFooter: ['userId', 'qiwi', 'wm', 'bank_rub', 'money_rub', 'bank_usd', 'money_usd', 'comission', 'actions'],
      filters: [
        {
          label: 'Период',
          direction: FilterTarget.BACK,
          control: {
            value: moment(),
            name: 'period',
            type: ControlType.DATE_MONTH,
            valueType: ValueType.STRING,
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
          footer: {
            label: 'Итого',
            styles: { color: '#e3b04e' },
            classes: { 'border--top': true, 'w-200': true },
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
                userName: el.userName,
                count: el?.unhandledMoneyRequestCount,
              }),
            },
            classes: { 'w-150': true },
          },
        },

        // Qiwi
        // Webmoney
        // Банковская карта(₽)
        // Наличные(₽)
        // Банковская карта($)
        // Наличные($)

        ...[
          { key: 'qiwi', name: 'Qiwi', currency: '₽' },
          { key: 'wm', name: 'Webmoney', currency: '$' },
          { key: 'bank_rub', name: 'Банковская карта(₽)', currency: '₽' },
          { key: 'money_rub', name: 'Наличные(₽)', currency: '₽' },
          { key: 'bank_usd', name: 'Банковская карта($)', currency: '$' },
          { key: 'money_usd', name: 'Наличные($)', currency: '$' },
        ].map(({ key, name, currency }) => {
          return {
            matColumnDef: key,
            header: {
              label: name,
              classes: { 'w-100': true },
            },
            cell: {
              calculated: el => parseNumber(el[key]?.value || 0, 'ru', '1.0-1') + ' ' + currency,
              classes: { 'w-100': true },
            },
            footer: {
              calculated: (item, items) =>
                parseNumber(this.getTotalData(items.map(c => c[key]?.value)), 'ru', '1.0-1') + ' ' + currency,
              classes: { 'w-100': true, 'border--top': true },
            },
          };
        }),

        {
          matColumnDef: 'comission',
          header: {
            label: 'Комиссия',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumber(el.comission) + ' %',
            classes: { 'w-100': true },
          },
          footer: {
            calculated: (item, items) => parseNumber(this.totalComission) + ' %',
            classes: { 'w-100': true, 'border--top': true },
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
              contextCalculated: el => ({ action: () => this.goToWorkingCapital(el.userId) }),
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
        list: ({ period = moment().format('DD.MM.YYYY') }) => {
          return this.setWorkingCapitalData(period).pipe(map(el => this.tableMappedItems(el)));
        },
      },
      rowConfig: {
        header: {
          sticky: true,
        },
        // footer: {
        //   sticky: true,
        // },
      },
    };
  }
  public goToWorkingCapital(id: string): void {
    const params = Object.keys(this.route.snapshot.queryParams).reduce((acc, key) => {
      const filter = this.route.snapshot.queryParams[key];
      acc[key] = filter;
      if (filter.includes(FilterTarget.FRONT)) {
        acc[key] += FilterOptions.SKIP;
      }
      return acc;
    }, {});

    this.router.navigate(['/working_capital', id], {
      queryParams: { ...params, return: 'yes' },
    });
  }
}
