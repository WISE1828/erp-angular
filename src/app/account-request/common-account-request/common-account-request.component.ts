import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AccountRequestService, ICommonAccountRequest } from '../../shared/services/account-request.service';
import { UserInfoService } from '../../shared/services/user-info.service';
import { FormGroup } from '@angular/forms';
import { NotificationService } from '../../shared/services/notification.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  ControlType,
  DataTable,
  FilterOptions,
  FilterTarget,
  FilterType,
  ValueType,
} from '../../shared/components/data-table/data-table.models';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { of, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { parseNumber, parseNumberWithPrefix } from '../../shared/helpers';
import { uniq } from 'lodash';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as http from 'http';

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
  selector: 'app-common-account-request',
  templateUrl: './common-account-request.component.html',
  styleUrls: ['./common-account-request.component.scss', '../account-request.component.scss'],
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
export class CommonAccountRequestComponent implements OnInit {
  public form: FormGroup;
  public roles = this.auth.rolesListView;
  public paymentInfoTypes = this.userInfoService.paymentInfoTypes;
  public role: number;
  teams = new Subject();

  constructor(
    private workingCapitalService: AccountRequestService,
    public userInfoService: UserInfoService,
    private notificationService: NotificationService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.setDataTable();
  }
  get isAccessToUserProfile() {
    return [+this.auth.roles.admin, +this.auth.roles.teamlead, +this.auth.roles.financier].includes(this.role);
  }
  public getTotalData(items: ICommonAccountRequest[], field: string): number {
    return items.reduce((a, c) => a + c[field], 0);
  }

  // TABLE
  public cellContent: any = {};
  public dataTableConfig: DataTable<ICommonAccountRequest>;
  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.cellContent = changes?.content;
  }

  private tableMappedItems(items) {
    return items.map(item => ({
      cost: item.cost,
      count: item.count,
      unhandledRequestCount: item?.unhandledRequestCount,
      userRoleId: item.roleId,
      teamId: item.teamId,
      userId: item.userId,
      userName: item.userName,
      actions: true,
    }));
  }
  private setDataTable() {
    this.dataTableConfig = {
      // this is kostyl, sorry
      tableName: localStorage.getItem('userId'),
      displayColumns: ['userId', 'userName', 'count', 'cost', 'actions'],
      displayFooter: ['userId', 'count', 'cost', 'actions'],
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
                redirectUrl: this.isAccessToUserProfile && `/profile/${el.userId}`,
                userName: el.userName,
                count: el?.unhandledRequestCount,
              }),
            },
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'count',
          header: {
            label: 'Количество',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumber(el.count),
            classes: { 'w-100': true },
          },
          footer: {
            calculated: (item, items) => parseNumber(this.getTotalData(items, 'count')),
            classes: { 'w-100': true, 'border--top': true },
          },
        },
        {
          matColumnDef: 'cost',
          header: {
            label: 'Стоимость',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.cost, '₽'),
            classes: { 'w-100': true },
          },
          footer: {
            calculated: (item, items) => parseNumberWithPrefix(this.getTotalData(items, 'cost'), '₽'),
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
              contextCalculated: el => ({ action: () => this.goToAccountRequest(el.userId) }),
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
          return this.workingCapitalService.getCommonAccountRequestData(period).pipe(
            map(this.tableMappedItems),
            tap(data => {
              const teams = uniq(data.map(el => el.teamId))
                .sort()
                .map(el => ({ id: el, label: el }));

              this.teams.next(teams);
            })
          );
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
  public goToAccountRequest(id: string): void {
    const params = Object.keys(this.route.snapshot.queryParams).reduce((acc, key) => {
      const filter = this.route.snapshot.queryParams[key];
      acc[key] = filter;
      if (filter.includes(FilterTarget.FRONT)) {
        acc[key] += FilterOptions.SKIP;
      }
      return acc;
    }, {});
    this.router.navigate(['/account_request', id], {
      queryParams: { ...params, return: 'yes' },
    });
  }
}
