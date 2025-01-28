import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import * as moment from 'moment';

const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'DD/MM/YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'DD/MM/YYYY',
  },
};

@Component({
  selector: 'app-date-period',
  templateUrl: './date-period.component.html',
  styleUrls: ['../data-table/data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class DatePeriodComponent implements OnInit {
  @Input()
  filter;

  @Input()
  loading;

  @Input()
  applyFilter;

  @Input()
  parseMomentDate;

  nowDate = moment();
  minDate = moment(localStorage.getItem('created_at')).startOf('month').toDate();

  constructor() {}

  ngOnInit(): void {}
}
