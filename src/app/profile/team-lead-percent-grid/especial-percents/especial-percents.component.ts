import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  ControlType,
  DataTable,
  DataTableActions,
  FilterTarget,
  FilterType,
  ValueType,
} from '../../../shared/components/data-table/data-table.models';
import { parseByType } from '../../../shared/helpers';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { EspecialPercentsService } from './especial-percents.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserInfoService } from '../../../shared/services/user-info.service';
import { uniq } from 'lodash';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '../../../shared/services/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ActivatedRoute } from '@angular/router';

@UntilDestroy()
@Component({
  selector: 'app-especial-percents',
  templateUrl: './especial-percents.component.html',
  styleUrls: ['./especial-percents.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspecialPercentsComponent implements OnInit {
  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.dataTableInstance = changes;
    this.cellContent = changes?.content;
  }
  dataTableInstance;
  currentItems = [];
  public cellContent: any = {};
  public activeFilers = {};
  public dataTableConfig: DataTable<any>;
  public selectedItemId;
  filteredData;
  public selectedCommentId;
  filterChange(e) {
    this.filteredData = e;
    // if (e?.length) {
    //   this.users.next(this.usersAll.filter(el => e[0]?.control?.value.includes(el.id?.roleId)));
    // }
    this.cd.detectChanges();
  }
  selectedUser;
  loading = false;

  percent = 0;
  usersAll = [];
  users = new BehaviorSubject([]);
  roles = new BehaviorSubject([]);
  userId;
  user;
  date;
  constructor(
    private auth: AuthService,
    private userInfoService: UserInfoService,
    private cd: ChangeDetectorRef,
    private service: EspecialPercentsService,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  get loadUsers() {
    return this.userInfoService.getAllUsers([], true, this.user?.teamId);
  }
  get loadPercents() {
    return this.userInfoService.getStatisticAdminTeamLead(this.userId, this.date);
  }

  arrayUniqueByKey = (array, key) => [...new Map(array.map(item => [item[key], item])).values()];

  loadData() {
    return combineLatest(this.loadPercents, this.loadUsers).pipe(
      untilDestroyed(this),
      tap(([percents, userList]: any) => {
        const {
          customLeadPercent: { especialPercents },
        } = percents;
        this.currentItems = especialPercents || [];

        let users = userList
          .filter(el => !especialPercents.find(p => p.userId === el.id))
          ?.sort((a, b) => {
            const label = el => `(${el.id}) ${el.userName}`;
            return label(a).localeCompare(label(b));
          })
          ?.map((el: any) => ({ id: el, label: `(${el.id} - ${this.auth.rolesRU[el.roleId]}) ${el.userName}` }));

        users = this.arrayUniqueByKey(users, 'label');

        let roles = especialPercents
          ?.map((el: any) => ({ id: el.roleId, label: this.auth.rolesRU[el.roleId] }))
          ?.sort((a, b) => {
            const label = el => el.label;
            return label(a).localeCompare(label(b));
          });
        roles = this.arrayUniqueByKey(roles, 'label');

        this.users.next(users);
        this.roles.next(roles);
      })
    );
  }

  ngOnInit() {
    this.loading = true;
    this.userId = this.route.children?.[0].snapshot?.params?.id;
    this.date = this.userInfoService.date;
    this.userInfoService
      .getUserInfo(this.userId)
      .pipe(
        switchMap((user: any) => {
          this.user = user;
          return this.loadData();
        }),
        untilDestroyed(this)
      )
      .subscribe(
        () => {
          this.setDataTable();
          this.loading = false;
          this.cd.detectChanges();
        },
        error => {
          this.loading = false;
          this.currentItems = [];
          this.users.next([]);
          this.roles.next([]);
          this.setDataTable();
          this.cd.detectChanges();
        }
      );
  }

  add(selectedUser) {
    this.loading = true;
    this.service
      .add(this.userId, this.date, {
        userId: selectedUser?.id,
        profitPercent: 0,
      })
      .pipe(
        switchMap(() => {
          return this.loadData();
        }),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.selectedUser = undefined;
        this.setDataTable();
        this.loading = false;
        this.cd.detectChanges();
      });
  }

  getData() {
    return of(this.tableMappedItems([...this.currentItems]));
  }

  isFinite(id) {
    return Number.isFinite(id);
  }
  tableMappedItems(items) {
    return items.map((item, index) => ({
      rowId: item.userId,
      id: item?.userId,
      username: item?.username,
      roleId: item?.roleId,
      profitPercent: item?.profitPercent,
      actions: false,
    }));
  }
  setDataTable() {
    this.dataTableConfig = undefined;
    this.cd.detectChanges();
    this.dataTableConfig = {
      tableName: 'especialPercents',
      displayColumns: ['username', 'roleId', 'profitPercent', 'actions'],
      actions: new Map<DataTableActions, (...args) => any>([
        [
          DataTableActions.SELECT,
          selectedRowId => {
            this.selectedItemId = selectedRowId;
            this.cd.detectChanges();
          },
        ],
      ]),
      filters: [
        {
          label: 'Роль',
          direction: FilterTarget.FRONT,
          types: FilterType.INCLUDES_NUM,
          control: {
            valueType: ValueType.ARRAY,
            value: [],
            type: ControlType.MULTI_SELECT,
            name: 'roleId',
            source: this.roles,
          },
        },
      ],
      cells: [
        {
          matColumnDef: 'username',
          header: {
            label: 'ФИО',
            classes: { 'w-150': true },
          },
          cell: {
            calculated: el => el.username,
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'roleId',
          header: {
            label: 'Роль',
            classes: { 'w-150': true },
          },
          cell: {
            calculated: el => this.auth.rolesRU[el.roleId],
            classes: { 'w-150': true },
          },
        },
        {
          matColumnDef: 'profitPercent',
          header: {
            label: 'Процент',
            classes: { 'w-150': true },
          },
          cell: {
            calculated: el => el.profitPercent,
            control: {
              calculatedValue: el => el.profitPercent,
              name: 'profitPercent',
              type: ControlType.INPUT,
              valueType: ValueType.NUMBER,
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
              templateCalculated: () => this.cellContent.actionsElement,
              contextCalculated: el =>
                (this.selectedItemId === el.rowId && {
                  save: () => {
                    this.loading = true;
                    const changes: any = this.dataTableConfig.cells.reduce((acc, cur) => {
                      if (cur.cell?.control?.name && cur.cell?.control?.value) {
                        acc[cur.cell?.control?.name] = parseByType(
                          cur.cell?.control?.valueType,
                          cur.cell?.control?.value
                        );
                      }
                      return acc;
                    }, {});

                    const item = this.currentItems.find(it => it?.userId === el?.id);

                    let updatedData = {
                      ...item,
                      ...changes,
                      id: item?.userId,
                      rowId: undefined,
                      actions: undefined,
                    };

                    updatedData = {
                      userId: updatedData?.id,
                      profitPercent: updatedData?.profitPercent,
                    };

                    this.dataTableConfig.crudAPI.update(updatedData).subscribe();
                  },
                  close: () => {
                    this.dataTableInstance.resetControlValue(el?.id);
                    this.selectedItemId = null;
                    this.cd.detectChanges();
                  },
                }) ||
                (!this.selectedItemId && {
                  delete: () => {
                    this.loading = true;
                    this.dataTableInstance.resetControlValue(el.id);
                    this.service
                      .delete(this.userId, this.date, el.id)
                      .pipe(
                        switchMap(() => {
                          return this.loadData();
                        }),
                        untilDestroyed(this)
                      )
                      .subscribe(() => {
                        this.setDataTable();
                        this.loading = false;
                        this.cd.detectChanges();
                      });
                    this.selectedItemId = null;
                  },
                }),
            },
            classes: { 'hide-border': true, 'w-50': true },
          },
        },
      ],
      crudAPI: {
        list: () => {
          return this.getData();
        },
        update: item => {
          return this.service.update(this.userId, this.date, item).pipe(
            switchMap(() => {
              return this.loadData();
            }),
            tap(() => {
              this.selectedItemId = null;
              this.setDataTable();
              this.loading = false;
              this.cd.detectChanges();
            }),
            untilDestroyed(this)
          );
        },
      },
      rowConfig: {
        header: {
          sticky: true,
        },
      },
    };
  }
}
