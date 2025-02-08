import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationService } from '../../shared/services/notification.service';
import { TrackersService } from '../../shared/services/trackers.service';
import { IStatistic, UserInfoService } from '../../shared/services/user-info.service';
import { WorkPerformanceService } from '../../shared/services/work-performance.service';
import { DailyRoiRecountComponent } from '../daily-roi-recount/daily-roi-recount.component';
import { MotivationsGridComponent } from '../motivations-grid/motivations-grid.component';
import { PercentsGridComponent } from '../percents-grid/percents-grid.component';
import { PreviousMonthFinancesComponent } from '../previous-month-finances/previous-month-finances.component';

@UntilDestroy()
@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrationComponent {
  @Input() statistic: IStatistic;
  @Output() showReports = new EventEmitter();
  public closingOS = false;
  public closingDailyRoi = false;
  public isWorkingCapitalTermClosed = false;
  public isPayedTermClosed = false;

  constructor(
    private userInfoService: UserInfoService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    private trackersService: TrackersService,
    private workPerformanceService: WorkPerformanceService
  ) {}

  public closeOS(): void {
    this.closingOS = true;
    this.userInfoService
      .closeOS()
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.closingOS = false;
          this.isWorkingCapitalTermClosed = true;
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При совершении запроса произошла ошибка');
          this.cd.detectChanges();
        }
      );
  }

  // public closeDailyRoi(): void {
  //   this.closingDailyRoi = true;
  //   this.userInfoService
  //     .closeDailyRoi()
  //     .pipe(untilDestroyed(this))
  //     .subscribe(
  //       () => {
  //         this.closingDailyRoi = false;
  //         this.isPayedTermClosed = true;
  //         this.cd.detectChanges();
  //       },
  //       () => {
  //         this.notificationService.showMessage('error', 'При совершении запроса произошла ошибка');
  //         this.cd.detectChanges();
  //       }
  //     );
  // }

  public openPercentsGridWindow() {
    this.dialog.open(PercentsGridComponent, {
      width: '520px',
    });
  }

  public openMotivationsGridWindow() {
    this.dialog.open(MotivationsGridComponent, {
      width: '520px',
    });
  }

  public showTrackers() {
    this.trackersService.showDialog();
  }

  public showBudget() {
    this.workPerformanceService.showDialog();
  }

  public showRoiRecount() {
    this.dialog.open(DailyRoiRecountComponent, {
      width: '520px',
      autoFocus: false,
      hasBackdrop: true,
    });
  }

  public openPreviousMonthFinances() {
    this.dialog.open(PreviousMonthFinancesComponent, {
      width: '520px',
      autoFocus: false,
      hasBackdrop: true,
    });
  }
}
