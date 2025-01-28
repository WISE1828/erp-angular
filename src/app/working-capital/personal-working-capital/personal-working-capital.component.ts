import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { IWorkingCapital, WorkingCapitalService } from '../../shared/services/working-capital';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { AuthService } from '../../shared/services/auth.service';
import { map, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { NotificationService } from '../../shared/services/notification.service';
import { IUserInfo, UserInfoService } from '../../shared/services/user-info.service';
import * as moment from 'moment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IEmptyUser } from '../../shared/interfaces/empty-user.interface';
import {
  ControlType,
  DataTable,
  DataTableActions,
  FilterOptions,
  FilterTarget,
  ValueType,
} from '../../shared/components/data-table/data-table.models';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { parseByType, parseNumber } from '../../shared/helpers';

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
  selector: 'app-working-capital',
  templateUrl: './personal-working-capital.component.html',
  styleUrls: ['./personal-working-capital.component.scss', '../working-capital.component.scss'],
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
export class PersonalWorkingCapitalComponent implements OnInit {
  public usdTypes = this.userInfoService.paymentInfoTypes
    .filter(el => el.currency === 3)
    .map(el => +el.paymentInfoType);
  public loading = false;
  public showBackButton: boolean;
  public workingCapitalData: IWorkingCapital;
  public filters: any;
  public paymentInfoDailyByRow: any;
  columns = [];
  public role: number;
  public userId: string;
  public paramsId: string;
  public isRequestCreate = false;
  public editingFactRemains = false;
  public editingNeedRemains = false;
  public remainsLoading = false;
  public remainsForm: FormGroup;
  public moneyRequestShown = false;
  public date: FormControl;
  public user: IUserInfo | IEmptyUser;
  isActive: boolean;

  constructor(
    private workingCapitalService: WorkingCapitalService,
    public auth: AuthService,
    private route: ActivatedRoute,
    public notificationService: NotificationService,
    public userInfoService: UserInfoService,
    private cd: ChangeDetectorRef,
    private router: Router
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

    this.userInfoService
      .getUserInfo(this.paramsId)
      .pipe(
        tap(user => {
          this.user = user || {
            id: +this.paramsId,
            lastName: 'Not',
            firstName: 'Found',
            teamId: null,
          };

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

  get isAdmin() {
    return this.role === this.auth.roles.admin;
  }

  public getWorkingCapitalData(date) {
    return this.workingCapitalService.getWorkingCapitalData(this.paramsId, date);
  }
  public setWorkingCapitalData(response): void {
    this.workingCapitalData = response;
    this.isActive = this.isAdmin || response?.isActive;
    this.createForm();
    if (response?.paymentInfoDailyGroups?.length) {
      this.moneyRequestShown = true;
    }
    this.paymentInfoDailyByRow = [];
    if (this.workingCapitalData?.paymentInfoDailyGroups?.[0]) {
      let daysNumber = this.workingCapitalData.paymentInfoDailyGroups[0].length;
      while (daysNumber > 0) {
        const item = {};
        item['date'] = this.workingCapitalData.paymentInfoDailyGroups[0][daysNumber - 1].date;
        this.workingCapitalData.paymentInfoDailyGroups.forEach(group => {
          item[`payment_${group[daysNumber - 1].id}`] = group[daysNumber - 1];
        });
        this.paymentInfoDailyByRow.push(item);
        daysNumber -= 1;
      }
      this.paymentInfoDailyByRow = this.paymentInfoDailyByRow.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
      this.columns = this.workingCapitalData.paymentInfoDailyGroups.map(item => {
        return {
          name: item[0].name,
          paymentInfoType: this.getType(item[0].paymentInfoType)?.name,
          type: item[0].paymentInfoType,
        };
      });
    }
  }

  public getType(paymentInfoType): any {
    return this.userInfoService.paymentInfoTypes.find(type => type.paymentInfoType == paymentInfoType);
  }

  public createForm(): void {
    this.remainsForm = new FormGroup({
      factRemainsUsd: new FormControl(this.workingCapitalData.factRemains?.usd || 0, []),
      factRemainsRub: new FormControl(this.workingCapitalData.factRemains?.rub || 0, []),
      needRemainsUsd: new FormControl(this.workingCapitalData.needRemains?.usd || 0, []),
      needRemainsRub: new FormControl(this.workingCapitalData.needRemains?.rub || 0, []),
    });
  }

  public addNewRequest(): void {
    this.isRequestCreate = true;
  }
  public closeRequest(): void {
    this.isRequestCreate = false;
  }
  public createRequest(request: any): any {
    this.workingCapitalData.unhandledMoneyRequests.push(request);
    this.closeRequest();
  }
  public onDeleteRequest(id: number): void {
    this.workingCapitalData.unhandledMoneyRequests = this.workingCapitalData.unhandledMoneyRequests.filter(
      item => item.id !== id
    );
    // this.ngOnInit();
    this.getData();
    this.cd.detectChanges();
  }
  public saveRemains(remainsType: string): void {
    this.remainsLoading = true;
    const item = {
      remainsFact: {
        usd: +this.remainsForm.get('factRemainsUsd').value,
        rub: +this.remainsForm.get('factRemainsRub').value,
      },
      remainsNeed: {
        usd: +this.remainsForm.get('needRemainsUsd').value,
        rub: +this.remainsForm.get('needRemainsRub').value,
      },
    };
    this.workingCapitalService
      .saveRemains(item, +this.workingCapitalData.termId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.remainsLoading = false;
          this[remainsType] = false;
          this.workingCapitalData.factRemains = {
            usd: this.remainsForm.get('factRemainsUsd').value,
            rub: this.remainsForm.get('factRemainsRub').value,
          };
          this.workingCapitalData.needRemains = {
            usd: this.remainsForm.get('needRemainsUsd').value,
            rub: this.remainsForm.get('needRemainsRub').value,
          };
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При обновлении данных произошла ошибка');
          this.remainsLoading = false;
          this[remainsType] = false;
          this.cd.detectChanges();
        }
      );
  }
  public cancelEditing(remainsType: string): void {
    this.remainsForm.get('factRemainsUsd').setValue(this.workingCapitalData.factRemains?.usd || 0);
    this.remainsForm.get('factRemainsRub').setValue(this.workingCapitalData.factRemains?.rub || 0);
    this.remainsForm.get('needRemainsUsd').setValue(this.workingCapitalData.needRemains?.usd || 0);
    this.remainsForm.get('needRemainsRub').setValue(this.workingCapitalData.needRemains?.rub || 0);
    this[remainsType] = false;
  }
  public showMoneyRequest(): void {
    this.moneyRequestShown = !this.moneyRequestShown;
  }

  // TABLE
  public cellContent: any = {};
  public dataTableConfig: DataTable<IWorkingCapital>;
  public selectedItemId = null;
  private dataTableInstance;

  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.cellContent = changes?.content;
    this.dataTableInstance = changes;
  }

  public getTotalData(items): number {
    return items.reduce((acc, cur) => acc + cur || 0, 0);
  }

  get isAccessToRequest() {
    return [+this.auth.roles.admin].includes(this.role);
  }
  private tableMappedItems(items) {
    const parsedObj = this.workingCapitalData.paymentInfoDailyGroups.reduce(
      (acc, cur) => (acc = { ...acc, [`${cur[0].name}_${cur[0].paymentInfoType}`]: cur }),
      {}
    );
    return items.map((item, index) => ({
      id: index,
      rowId: 'row_' + index,
      date: item.date,
      actions: true,
      ...Object.keys(parsedObj).reduce((acc, key) => ({ ...acc, [key]: parsedObj[key][index].value }), {}),
    }));
  }
  private setDataTable() {
    const baseConfig = {
      displayColumns: ['date', 'actions'],
      displayFooter: ['date', 'actions'],
      cells: [
        {
          matColumnDef: 'date',
          header: {
            label: 'Дата',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => {
              const date = moment(el.date).toDate();
              return formatDate(date, 'mediumDate', 'ru');
            },
            classes: { 'w-100': true },
          },
          footer: {
            label: 'Итого',
            classes: { 'w-100': true, 'border--top': true },
            styles: { color: '#e3b04e' },
          },
        },
        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'w-50': true },
          },
          cell: {
            content: {
              templateCalculated: el => {
                return this.selectedItemId === el.rowId && this.cellContent.actionsElement;
              },
              contextCalculated: el => {
                return (
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

                      const parsedObj = this.workingCapitalData.paymentInfoDailyGroups.reduce(
                        (acc, cur) => (acc = { ...acc, [`${cur[0].name}_${cur[0].paymentInfoType}`]: cur }),
                        {}
                      );

                      const updatedData = Object.keys(parsedObj).map(key => {
                        const findEl = parsedObj[key].filter(item => item.date === el.date)[0];
                        if (key in changes) {
                          findEl.value = changes[key];
                        }
                        return findEl;
                      });

                      this.dataTableConfig.crudAPI.update(updatedData).subscribe();
                    },
                    close: () => {
                      this.dataTableInstance.resetControlValue(el.id);
                      this.selectedItemId = null;
                      this.cd.detectChanges();
                    },
                  }
                );
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
    };
    const appendCalculatedDataToConfig = () => {
      const parsedObj = this.workingCapitalData.paymentInfoDailyGroups.reduce(
        (acc, cur) => (acc = { ...acc, [`${cur[0].name}_${cur[0].paymentInfoType}`]: cur }),
        {}
      );
      const keys = Object.keys(parsedObj);
      this.dataTableConfig.displayColumns = [
        ...baseConfig.displayColumns.slice(0, 1),
        ...keys.map(key => key),
        ...baseConfig.displayColumns.slice(-1),
      ];
      this.dataTableConfig.displayFooter = [
        ...baseConfig.displayFooter.slice(0, 1),
        ...keys.map(key => key),
        ...baseConfig.displayFooter.slice(-1),
      ];
      this.dataTableConfig.cells = [
        ...baseConfig.cells.slice(0, 1),
        ...keys.map(key => {
          const matColumnDef = key;
          const name = key.split('_')[0];
          return {
            matColumnDef: matColumnDef,
            header: {
              label: name,
              content: {
                template: this.cellContent.itemsContainer,
                context: {
                  items: [
                    {
                      label: this.getType(key.split('_')[1])?.name,
                      styles: {
                        fontSize: '0.7rem',
                        color: '#8a9094',
                        paddingBottom: '5px',
                        fontWeight: 'lighter',
                      },
                      classes: { 'w-100': true },
                    },
                  ],
                },
              },
              classes: { 'w-100': true },
            },
            cell: {
              calculated: el => {
                const source = parsedObj[key]?.find(item => item.date === el.date);
                const currency = this.userInfoService.currency[source.currency];
                return parseNumber(el[key]) + ' ' + currency;
              },
              control: {
                calculatedValue: el => el[key],
                name: key,
                type: ControlType.INPUT,
                valueType: ValueType.NUMBER,
              },
              classes: { 'w-100': true },
            },
            footer: {
              calculated: (item, items) => {
                const source = parsedObj[key];
                const currency = this.userInfoService.currency[parsedObj[key][0].currency];
                return parseNumber(this.getTotalData(source.map(c => c?.value)), 'ru', '1.0-1') + ' ' + currency;
              },
              classes: { 'w-100': true, 'border--top': true },
            },
          };
        }),
        ...baseConfig.cells.slice(-1),
      ];
    };
    this.dataTableConfig = {
      ...baseConfig,
      tableName: 'personalWorkingCapital',
      actions: new Map<DataTableActions, (...args) => any>([
        [
          DataTableActions.SELECT,
          selectedRowId => {
            if (!this.isActive) return;
            this.selectedItemId = selectedRowId;
            this.cd.detectChanges();
          },
        ],
        [
          DataTableActions.CHANGE,
          el => {
            const changes: any = this.dataTableConfig.cells.reduce((acc, cur) => {
              if (cur.cell?.control?.name && cur.cell?.control?.value) {
                acc[cur.cell?.control?.name] = parseByType(cur.cell?.control?.valueType, cur.cell?.control?.value);
              }
              return acc;
            }, {});

            const parsedObj = this.workingCapitalData.paymentInfoDailyGroups.reduce(
              (acc, cur) => (acc = { ...acc, [`${cur[0].name}_${cur[0].paymentInfoType}`]: cur }),
              {}
            );

            const updatedData = Object.keys(parsedObj).map(key => {
              const findEl = parsedObj[key].filter(item => item.date === el.date)[0];
              if (key in changes) {
                findEl.value = changes[key];
              }
              return findEl;
            });

            updatedData.forEach((el, index) => {
              const indexItem = this.workingCapitalData.paymentInfoDailyGroups[index].findIndex(p => p.id === el.id);
              if (indexItem != -1) {
                this.workingCapitalData.paymentInfoDailyGroups[index][indexItem] = el;
              }
            });
            this.cd.detectChanges();
          },
        ],
      ]),
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
      crudAPI: {
        list: ({ period = moment().format('DD.MM.YYYY') }) => {
          return this.getWorkingCapitalData(period).pipe(
            tap(data => this.setWorkingCapitalData(data)),
            tap(() => appendCalculatedDataToConfig()),
            map(() => this.tableMappedItems(this.paymentInfoDailyByRow))
          );
        },
        update: payments =>
          this.workingCapitalService.updateRow(payments, false).pipe(
            tap(resp => {
              payments.forEach((el, index) => {
                const indexItem = this.workingCapitalData.paymentInfoDailyGroups[index].findIndex(p => p.id === el.id);
                if (indexItem != -1) {
                  this.workingCapitalData.paymentInfoDailyGroups[index][indexItem] = el;
                }
              });

              this.setWorkingCapitalData(this.workingCapitalData);
              const item = this.tableMappedItems(this.paymentInfoDailyByRow).find(
                el => el.rowId === this.selectedItemId
              );
              this.dataTableInstance.updListSync(item);
              this.selectedItemId = null;
              this.cd.detectChanges();
              // this.getData();
            })
          ),
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

  getData() {
    this.dataTableInstance.ngOnInit();
  }
}
