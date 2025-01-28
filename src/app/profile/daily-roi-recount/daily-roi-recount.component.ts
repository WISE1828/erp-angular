import { Component, OnInit, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ControlType, ValueType } from '../../shared/components/data-table/data-table.models';
import * as moment from 'moment';
import { FinancesService } from '../../finances/finances.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-daily-roi-recount',
  templateUrl: './daily-roi-recount.component.html',
  styleUrls: ['./daily-roi-recount.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyRoiRecountComponent implements OnInit {
  public isLoading = false;
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
