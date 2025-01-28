import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, tap } from 'rxjs/operators';
import { WorkPerformanceService } from '../../../../shared/services/work-performance.service';
import { MatTableDataSource } from '@angular/material/table';
import { BudgetItemComponent } from '../budget-item/budget-item.component';
import { AuthService } from '../../../../shared/services/auth.service';
import { UserInfoService } from '../../../../shared/services/user-info.service';

@UntilDestroy()
@Component({
  selector: 'app-budget-list',
  templateUrl: './budget-list.component.html',
  styleUrls: ['../../../../traffic/shared/traffic-styles.scss', './budget-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetListComponent implements OnInit {
  loading = false;
  xw;
  displayedColumns = ['teamId', 'commonBudget', 'button'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  role = null;
  filteredTeamForCreate = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private auth: AuthService,
    private dialog: MatDialog,
    private workPerformanceService: WorkPerformanceService,
    private userInfoService: UserInfoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.role = +localStorage.getItem('role');
    this.loadBudgets();
  }

  loadBudgets() {
    this.budgets$.pipe(untilDestroyed(this)).subscribe(
      () => {
        this.cd.detectChanges();
      },
      () => {
        this.cd.detectChanges();
      }
    );
  }

  get budgets$() {
    return this.workPerformanceService.getList(this.userInfoService?.date).pipe(
      tap(trackers => {
        trackers = trackers.map(t => ({ ...t, button: true }));
        this.dataSource = new MatTableDataSource<any>(trackers);
      })
    );
  }

  viewItem(data) {
    this.create(data);
  }

  create(data?) {
    this.filteredTeamForCreate = this.dataSource?.data?.map(({ teamId }) => teamId);

    if (!data) {
      data = { ...data, mode: 'Create', filterTeamList: this.filteredTeamForCreate };
    } else {
      data = { ...data, mode: 'Update', filterTeamList: this.filteredTeamForCreate };
    }

    this.dialog
      .open(BudgetItemComponent, {
        autoFocus: false,
        hasBackdrop: true,
        data,
      })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          this.loadBudgets();
        }
      });
  }

  get totalCommonBudget() {
    return this.dataSource?.data?.reduce((acc, { commonBudget }) => acc + commonBudget, 0) || 0;
  }

  get isAdmin() {
    return [this.auth.roles.admin, this.auth.roles.financier].includes(this.role);
  }
}
