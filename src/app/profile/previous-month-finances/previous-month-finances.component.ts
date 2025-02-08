import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed } from '@ngneat/until-destroy';
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';
import { FinancesService } from '../../finances/finances.service';
import { ControlType, ValueType } from '../../shared/components/data-table/data-table.models';
import { NotificationService } from '../../shared/services/notification.service';
import { UserInfoService } from '../../shared/services/user-info.service';

@Component({
  selector: 'app-previous-month-finances',
  templateUrl: './previous-month-finances.component.html',
  styleUrls: ['./previous-month-finances.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviousMonthFinancesComponent implements OnInit {
  public closingDailyRoi = false;
  public isLoading = false;
  public isPayedTermClosed = false;
  public messages = {
    success: false,
    error: false,
  };
  public controlData = {
    label: 'Период',
    control: {
      value: {
        startDate: moment().startOf('month').toDate(),
        endDate: moment(),
      },
      name: 'period',
      type: ControlType.DATE_PERIOD,
      valueType: ValueType.OBJECT,
    },
  };
  public range = {
    startDate: moment(this.controlData.control.value.startDate).format('DD.MM.YYYY'),
    endDate: moment(this.controlData.control.value.endDate).format('DD.MM.YYYY'),
  };
  constructor(
    private financesService: FinancesService,
    private cd: ChangeDetectorRef,
    private userInfoService: UserInfoService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  public recountRoi() {
    this.resetMessages();
    this.isLoading = true;
    this.financesService
      .recountRoi({ startDate: this.range.startDate, finishDate: this.range.endDate })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cd.detectChanges();
        })
      )
      .subscribe(
        () => this.showMessage('success'),
        () => this.showMessage('error')
      );
  }

  public closeDailyRoi(): void {
    this.closingDailyRoi = true;
    this.userInfoService
      .closeDailyRoi({ startDate: this.range.startDate, finishDate: this.range.endDate })
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.closingDailyRoi = false;
          this.isPayedTermClosed = true;
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При совершении запроса произошла ошибка');
          this.cd.detectChanges();
        }
      );
  }

  public showMessage(type: string): void {
    this.messages[type] = true;
    setTimeout(() => {
      this.messages[type] = false;
      this.cd.detectChanges();
    }, 3000);
  }

  public parseMomentDate(date) {
    return date ? date.format('DD.MM.YYYY') : undefined;
  }

  public applyFilter(filter, value) {
    this.range = value;
  }

  private resetMessages() {
    this.messages.error = false;
    this.messages.success = false;
  }
}
