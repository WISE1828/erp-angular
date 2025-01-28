import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  AccountRequestService,
  IAccountRequest,
  IAccountRequestTerm,
  ICreateOrEditAccountRequest,
} from '../../shared/services/account-request.service';
import { FormControl } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { AuthService } from '../../shared/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { combineLatest, of } from 'rxjs';
import { IUserInfo, UserInfoService } from '../../shared/services/user-info.service';
import * as moment from 'moment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IEmptyUser } from '../../shared/interfaces/empty-user.interface';
import { map, pluck, tap } from 'rxjs/operators';
import { parseByType, parseDate, parseNumber, parseNumberWithPrefix } from '../../shared/helpers';
import {
  ControlType,
  DataTable,
  DataTableActions,
  FilterOptions,
  FilterTarget,
  ValueType,
} from '../../shared/components/data-table/data-table.models';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';

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
  selector: 'app-account-request',
  templateUrl: './personal-account-requestcomponent.html',
  styleUrls: ['./personal-account-request.component.scss', '../account-request.component.scss'],
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
export class PersonalAccountRequestComponent implements OnInit {
  public loading = true;
  public showBackButton: boolean;
  public accountRequestData: IAccountRequestTerm;
  public accountRequestsApproved: IAccountRequest[];
  public filters: any;
  public role: number;
  public userId: string;
  public paramsId: string;
  public isRequestCreate = false;
  public accountRequestsShown = false;
  public date: FormControl;
  public user: IUserInfo | IEmptyUser;

  userList = [];
  countryList = [];

  constructor(
    private accountRequestService: AccountRequestService,
    public auth: AuthService,
    private route: ActivatedRoute,
    public notificationService: NotificationService,
    public userInfoService: UserInfoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.userId = localStorage.getItem('userId');

    const queryParams = this.route.snapshot.queryParams;
    const params = this.route.snapshot.params;
    this.filters = { ...queryParams };
    this.paramsId = params.id;
    if (queryParams['return'] === 'yes') {
      this.showBackButton = true;
      this.filters = { ...this.filters, return: undefined };
    }

    combineLatest(this.userInfoService.getUserInfo(this.paramsId), this.accountRequestService.storedData)
      .pipe(
        tap(([user, [userList, countryList]]) => {
          this.user = user || {
            id: +this.paramsId,
            lastName: 'Not',
            firstName: 'Found',
            teamId: null,
          };
          this.userList = userList.map(user => ({ id: user.id, label: user.userName }));
          this.countryList = countryList.map(geo => ({ id: geo.id, label: geo.shortName }));
          this.setDataTable();
          this.loading = false;
          this.cd.detectChanges();
        }),
        untilDestroyed(this)
      )
      .subscribe(
        undefined,
        error =>
          (this.user = {
            id: +this.paramsId,
            lastName: 'Not',
            firstName: 'Found',
            teamId: null,
          })
      );
  }

  get returnFilters() {
    return Object.keys(this.filters)?.reduce((acc, key) => {
      const filter = this.filters[key];
      acc[key] = filter;
      if (filter?.includes(FilterTarget.FRONT)) {
        acc[key] = acc[key].replace(FilterOptions.SKIP, '');
      }
      return acc;
    }, {});
  }
  get isAccessToRequest() {
    return [+this.auth.roles.admin, +this.auth.roles.farmer, +this.auth.roles.farmerTeamlead].includes(this.role);
  }
  get isAccessToEditTable() {
    return [+this.auth.roles.admin, +this.auth.roles.farmerTeamlead].includes(this.role);
  }
  get isRequestsEmpty() {
    return (
      (!this.accountRequestData?.accountRequests?.length && !this.isRequestCreate) ||
      this.accountRequestData?.accountRequests.every(el => el.isApproved)
    );
  }

  public addNewRequest(): void {
    this.isRequestCreate = true;
    this.accountRequestService.selectedRowId.next(null);
  }
  public closeRequest(): void {
    this.isRequestCreate = false;
  }
  public createRequest(request: any): any {
    this.accountRequestData.accountRequests.push(request);
    this.closeRequest();
    this.getData();
  }
  public onDeleteRequest(id: number): void {
    this.accountRequestData.accountRequests = this.accountRequestData.accountRequests.filter(item => item.id !== id);
    this.getData();
  }
  public onUpdateRequest() {
    this.getData();
  }
  public cancelEditing(remainsType: string): void {
    this[remainsType] = false;
  }
  public showAccountRequests(): void {
    this.accountRequestsShown = !this.accountRequestsShown;
  }

  // TABLE
  getData() {
    this.dataTableInstance.ngOnInit();
  }

  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.dataTableInstance = changes;
    this.cellContent = changes?.content;
  }

  dataTableInstance;

  public getTotalData(items: IAccountRequest[], field: string): number {
    return items?.reduce((a, c) => a + c[field], 0) || 0;
  }

  public tableMappedItems = items => {
    return items.map((item, index) => ({
      rowId: 'row_' + index,
      id: item.id,
      date: item.date,
      count: item.count,
      cost: item.cost,
      description: item.description,
      geoId: item.geo.id,
      operatorId: item.operatorId,
      isApproved: item.isApproved,
      termId: item.termId,
      actions: true,
    }));
  };
  public cellContent: any = {};
  public dataTableConfig: DataTable<IAccountRequest>;
  selectedItemId = null;
  setDataTable() {
    this.dataTableConfig = {
      tableName: localStorage.getItem('userId'),
      displayColumns: ['date', 'count', 'cost', 'description', 'geoId', 'operatorId', 'actions'],
      displayFooter: ['date', 'count', 'cost', 'actions'],
      actions: this.isAccessToEditTable
        ? new Map<DataTableActions, (...args) => any>([
            [
              DataTableActions.SELECT,
              selectedRowId => {
                this.selectedItemId = selectedRowId;
                this.cd.detectChanges();
              },
            ],
          ])
        : undefined,
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
      ],
      cells: [
        {
          matColumnDef: 'date',
          header: {
            label: 'Дата',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseDate(el.date),
            classes: { 'w-100': true },
          },
          footer: {
            label: 'Итого',
            classes: { 'w-100': true },
            styles: { color: '#e3b04e' },
          },
        },
        {
          matColumnDef: 'count',
          header: {
            label: 'Количество',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => el.count,
            classes: { 'w-100': true },
            control: {
              calculatedValue: el => el.count,
              name: 'count',
              type: ControlType.INPUT,
              valueType: ValueType.NUMBER,
            },
          },
          footer: {
            calculated: (item, items) => parseNumber(this.getTotalData(items, 'count')),
            classes: { 'w-100': true },
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
            control: {
              calculatedValue: el => el.cost,
              name: 'cost',
              type: ControlType.INPUT,
              valueType: ValueType.NUMBER,
            },
          },
          footer: {
            calculated: (item, items) => parseNumberWithPrefix(this.getTotalData(items, 'cost'), '₽'),
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'description',
          header: {
            label: 'Описание',
            classes: { 'w-150': true },
          },
          cell: {
            calculated: el => el.description,
            classes: { 'w-150': true },
            control: {
              calculatedValue: el => el.description,
              name: 'description',
              type: ControlType.INPUT,
              valueType: ValueType.STRING,
            },
          },
        },
        {
          matColumnDef: 'geoId',
          header: {
            label: 'Гео',
            classes: { 'w-200': true },
          },
          cell: {
            calculated: el => this.countryList.find(c => c.id === el.geoId).label,
            classes: { 'w-200': true },
            control: {
              calculatedValue: el => this.countryList.find(c => c.id === el.geoId),
              name: 'geoId',
              type: ControlType.SEARCH_INPUT,
              source: of(this.countryList),
              valueType: ValueType.STRING,
            },
          },
        },
        {
          matColumnDef: 'operatorId',
          header: {
            label: 'Оператор',
            classes: { 'w-150': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.userLinkElement,
              contextCalculated: el => ({
                redirectUrl: `/profile/${el.operatorId}`,
                userName: this.userList.find(u => u.id === el.operatorId)?.label,
              }),
            },
            control: {
              calculatedValue: el => this.userList.find(c => c.id === el.operatorId),
              name: 'operatorId',
              type: ControlType.SEARCH_INPUT,
              source: of(this.userList),
              valueType: ValueType.STRING,
            },
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'w-50': true },
          },
          cell: {
            content: {
              templateCalculated: el => this.selectedItemId === el.rowId && this.cellContent.actionsElement,
              contextCalculated: el =>
                this.selectedItemId === el.rowId && {
                  save: () => {
                    const changes: any = this.dataTableConfig.cells.reduce((acc, cur) => {
                      if (cur.cell?.control?.name && cur.cell?.control?.value) {
                        acc[cur.cell?.control?.name] = parseByType(
                          cur.cell?.control?.valueType,
                          cur.cell?.control?.value
                        );
                      }
                      return acc;
                    }, {});
                    const updatedData = {
                      ...el,
                      ...changes,
                      geoId: changes?.geoId.id,
                      geo: {
                        ...this.accountRequestService.countriesList.value.find(el => el.id === changes?.geoId.id),
                        accountRequests: undefined,
                      },
                      operatorId: changes?.operatorId.id,
                      operatorName: undefined,
                      rowId: undefined,
                      actions: undefined,
                    };

                    this.dataTableConfig.crudAPI.update(updatedData).subscribe();
                  },
                  close: () => {
                    this.dataTableInstance.resetControlValue(el.id);
                    this.selectedItemId = null;
                    this.cd.detectChanges();
                  },
                },
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
          return this.accountRequestService.getAccountRequestData(this.paramsId, period).pipe(
            tap(data => {
              this.accountRequestData = data;
              if (data.accountRequests?.length) {
                this.accountRequestsShown = true;
              }
            }),
            pluck('accountRequests'),
            map(this.tableMappedItems)
          );
        },
        update: item =>
          this.accountRequestService.editAccountRequest(item).pipe(
            tap(resp => {
              this.selectedItemId = null;
              resp = { ...resp, geoId: resp?.geo?.id };
              this.dataTableInstance.updListSync(resp);
              this.cd.detectChanges();
            })
          ),
      },
    };
  }
}
