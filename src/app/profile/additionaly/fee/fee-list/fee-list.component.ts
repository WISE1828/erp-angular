import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../shared/services/auth.service';
import { UserInfoService } from '../../../../shared/services/user-info.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { AdditionalFee, FeeService } from '../../../../shared/services/fee.service';
import { Router } from '@angular/router';
import {
  ControlType,
  DataTable,
  DataTableActions,
  ValueType,
} from '../../../../shared/components/data-table/data-table.models';
import * as moment from 'moment';
import { parseByType, parseMoment, parseNumber } from '../../../../shared/helpers';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountRequestService } from '../../../../shared/services/account-request.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-fee-list',
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeListComponent implements OnInit {
  loading = false;
  role = null;
  paramsId;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private auth: AuthService,
    private dialog: MatDialog,
    private additionalFeeService: FeeService,
    private userInfoService: UserInfoService,
    private cd: ChangeDetectorRef,
    private accountRequestService: AccountRequestService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.role = +localStorage.getItem('role');
    this.paramsId = this.router.url.split('/').slice(-1)[0];
    this.setDataTable();
  }

  get isAdmin() {
    return [this.auth.roles.admin].includes(this.role);
  }

  usersList = this.accountRequestService.getUsersByRole(7).pipe(
    switchMap(helpers =>
      this.accountRequestService
        .getUsersByRole(4)
        .pipe(
          map(smarts =>
            helpers.map(el => ({ ...el, role: 'Хелпер' })).concat(smarts.map(el => ({ ...el, role: 'Смарт' })))
          )
        )
    ),
    switchMap(data =>
      this.accountRequestService
        .getUsersByRole(3)
        .pipe(map(bayers => data.concat(bayers.map(el => ({ ...el, role: 'Баер' })))))
    ),
    map(data => {
      return data.map(user => ({ id: user.id, label: user.userName, role: user?.role }));
    })
  );
  isCreate = false;
  form = new FormGroup({
    userId: new FormControl(null, [Validators.required]),
    profitPercent: new FormControl(0, [Validators.required]),
  });

  showCreate() {
    this.isCreate = true;
    this.cd.detectChanges();
  }
  createRequestItem() {
    this.loading = true;
    const date = moment(parseMoment(this.userInfoService?.date)).startOf('month').format('DD.MM.YYYY');

    const payload = {
      benefeciaryId: +this.paramsId,
      profitPercent: this.form.get('profitPercent').value,
    } as any;

    const userId = this.form.get('userId').value;

    this.additionalFeeService.create(userId, date, payload).subscribe(
      () => {
        this.loading = false;
        this.onCloseRequest();
        this.getData();
        this.notificationService.showMessage('success', 'Успешно создано');
        this.cd.detectChanges();
      },
      () => {
        this.loading = false;
        this.notificationService.showMessage('error', 'При создании произошла ошибка');
        this.cd.detectChanges();
      }
    );
  }
  onCloseRequest() {
    this.form.reset();
    this.isCreate = false;
  }

  public cellContent: any = {};
  public dataTableConfig: DataTable<AdditionalFee>;
  selectedItemId;
  private dataTableInstance;

  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.cellContent = changes?.content;
    this.dataTableInstance = changes;
  }

  public tableMappedItems = items => {
    return items.map((item, index) => ({
      rowId: 'row_' + index,
      userId: item.id,
      userName: item.username,
      profitPercent: item.profitPercent,
      actions: true,
    }));
  };
  private setDataTable() {
    this.dataTableConfig = {
      tableName: 'feeTable',
      displayColumns: ['userId', 'userName', 'profitPercent', 'actions'],
      actions: this.isAdmin
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
            classes: { 'w-100': true },
          },
          cell: {
            calculated: !this.isAdmin ? el => el.userName : undefined,
            content: this.isAdmin && {
              templateCalculated: () => this.cellContent.userLinkElement,
              contextCalculated: el => ({
                redirectUrl: `/profile/${el.userId}`,
                userName: el.userName,
              }),
            },
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'profitPercent',
          header: {
            label: 'Процент',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumber(el.profitPercent) + ' %',
            control: {
              calculatedValue: el => el.profitPercent,
              name: 'profitPercent',
              type: ControlType.INPUT,
              valueType: ValueType.NUMBER,
            },
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'hide-bg': true, 'w-50': this.isAdmin },
          },
          cell: {
            content: this.isAdmin && {
              templateCalculated: el => {
                return this.cellContent.actionsElement;
              },
              contextCalculated: el => {
                return (
                  (this.selectedItemId === el.rowId && {
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
                      this.loading = true;
                      this.dataTableConfig.crudAPI.update(el.userId, changes).subscribe(
                        () => {
                          this.loading = false;
                          this.notificationService.showMessage('success', 'Успешно обновлено');
                          this.cd.detectChanges();
                        },
                        () => {
                          this.loading = false;
                          this.notificationService.showMessage('error', 'При обновлении произошла ошибка');
                          this.cd.detectChanges();
                        }
                      );
                    },
                    close: () => {
                      this.dataTableInstance.resetControlValue(el.id);
                      this.selectedItemId = null;
                      this.cd.detectChanges();
                    },
                  }) ||
                  (!this.selectedItemId && {
                    delete: () => {
                      this.loading = true;
                      this.additionalFeeService
                        .deleteById(el.userId)
                        .pipe(
                          tap(() => {
                            this.selectedItemId = null;
                            this.getData();
                          })
                        )
                        .subscribe(
                          () => {
                            this.loading = false;
                            this.notificationService.showMessage('success', 'Успешно удалено');
                            this.cd.detectChanges();
                          },
                          () => {
                            this.loading = false;
                            this.notificationService.showMessage('error', 'При удалении произошла ошибка');
                            this.cd.detectChanges();
                          }
                        );
                    },
                  })
                );
              },
            },
            classes: { 'hide-border': true, 'w-50': this.isAdmin },
          },
        },
      ],
      crudAPI: {
        list: () => {
          const date = moment(parseMoment(this.userInfoService?.date)).startOf('month').format('DD.MM.YYYY');
          return this.additionalFeeService.getList(this.paramsId, date).pipe(map(this.tableMappedItems));
        },
        update: (id, payload) =>
          this.additionalFeeService.updateById(id, payload).pipe(
            tap(() => {
              this.selectedItemId = null;
              this.getData();
            })
          ),
      },
    };
  }
  getData() {
    this.dataTableInstance.ngOnInit();
  }
}
