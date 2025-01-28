import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { formatDate } from '@angular/common';
import { UserInfoService } from '../../services/user-info.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  public formatedDate: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userInfoService: UserInfoService,
    private cd: ChangeDetectorRef
  ) {
    this.data = {
      items: this.data.items.map(item => ({
        ...item,
        loading: false,
        dateForm: new FormGroup({
          date: new FormControl(null, [Validators.required]),
        }),
      })),
    };
  }

  ngOnInit(): void {}

  dateFilterFn = date => {
    const currentDateObject = new Date();
    const dateObject = new Date(date);
    const currentYear = currentDateObject.getFullYear();
    const year = dateObject.getFullYear();
    const isMonthNotNext = dateObject.getMonth() <= currentDateObject.getMonth();
    const isYearNotNext = year < currentYear;
    const isYearCurrent = year === currentYear;
    return isYearNotNext || (isYearCurrent && isMonthNotNext);
  };

  public chosenMonthHandler(normalizedMonth, datepicker, dateForm): void {
    dateForm.get('date').setValue(normalizedMonth);
    datepicker.close();
    const momentDataObject = dateForm.get('date').value.toDate();
    const month = momentDataObject.getMonth();
    const year = momentDataObject.getFullYear();
    const date = +new Date(year, month, 1);
    this.formatedDate = formatDate(date, 'dd.MM.yyyy', 'ru');
  }

  getReport(item) {
    const fileName = item?.name?.replace(/ /gi, '_');
    item.loading = true;
    const date = formatDate(item.dateForm.get('date').value, 'dd.MM.yyyy', 'ru');
    item
      ?.action(date)
      .pipe(untilDestroyed(this))
      .subscribe(
        data => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(data);
          link.download = `${fileName}_${date}.xlsx`;
          link.click();
          link.remove();
          item.loading = false;
          this.cd.detectChanges();
        },
        () => {
          item.loading = false;
          this.cd.detectChanges();
        }
      );
  }
}
