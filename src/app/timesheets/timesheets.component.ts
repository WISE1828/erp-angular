import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';

import { EmployeeAttendanceService } from './services/employee-attendance.service';

import { IVisitLogRow } from './interfaces/visit-log-row.interface';
import { IVisitLogCell } from './interfaces/visit-log-cell.interface';
import { NotificationService } from '../shared/services/notification.service';
import { FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { isMoment } from 'moment';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
  selector: 'app-employee-attendance',
  templateUrl: './timesheets.component.html',
  styleUrls: ['./timesheets.component.scss'],
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
export class TimesheetsComponent implements OnInit, OnDestroy {
  minDate = moment(localStorage.getItem('created_at')).startOf('month').toDate();
  visitList: IVisitLogRow[];
  visitListFiltered: IVisitLogRow[];
  public form: FormGroup = new FormGroup({
    date: new FormControl(new Date(), []),
  });
  public formatedDate: string;
  public role;
  public userId: number;
  public roles = this.auth.rolesList;
  public monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];
  loading: boolean = false;
  rolesFilter = this.auth.rolesRU;
  teamList = [];
  roleList = [];
  filters: { [key: string]: { filterValue: string; filterField?: string } };

  dateFilterFn = date => date < new Date();

  public chosenMonthHandler(normalizedMonth, datepicker): void {
    this.form.get('date').setValue(normalizedMonth);
    datepicker.close();
    const momentDataObject = this.form.get('date').value.toDate();
    const month = momentDataObject.getMonth();
    const year = momentDataObject.getFullYear();
    const date = +new Date(year, month, 1);
    this.formatedDate = formatDate(date, 'dd.MM.yyyy', 'ru');
    this.getVisitList(this.formatedDate);
  }

  private destroyed$: Subject<void> = new Subject<void>();

  constructor(
    private auth: AuthService,
    private notificationService: NotificationService,
    public router: Router,
    private route: ActivatedRoute,
    private employeeAttendanceService: EmployeeAttendanceService,
    private cd: ChangeDetectorRef
  ) {}

  setFilter(filter) {
    this.filters = { ...this.filters, [filter.filterField]: { ...filter } };
    this.applyFilter();
  }

  applyFilter() {
    this.visitListFiltered = this.visitList.filter(data =>
      this.filters
        ? Object.keys(this.filters).every(filterKey => {
            const { filterField, filterValue } = this.filters[filterKey];
            return filterValue ? data.termUserInfo[filterField] === filterValue : true;
          })
        : true
    );
    this.cd.detectChanges();
  }

  get isTeamLead() {
    return [
      +this.auth.roles.teamlead,
      +this.auth.roles.farmerTeamlead,
      +this.auth.roles.teamLeadTechnicalSpecialist,
      +this.auth.roles.teamLeadPromotion,
    ].includes(+this.role);
  }

  get isAdminOrFinancier() {
    return [+this.auth.roles.admin, +this.auth.roles.financier].includes(+this.role);
  }

  get isAdminOrTeamLead() {
    return this.isTeamLead || this.isAdminOrFinancier;
  }

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.userId = +localStorage.getItem('userId');
    this.route.queryParams.pipe(untilDestroyed(this)).subscribe(queryParams => {
      const date = moment(queryParams?.date, 'DD.MM.YYYY').isValid() && moment(queryParams?.date, 'DD.MM.YYYY');
      this.formatedDate = queryParams?.date || formatDate(new Date(), 'dd.MM.yyyy', 'ru');
      this.getVisitList(this.formatedDate);

      if (date) {
        this.form.patchValue({ date });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.complete();
    this.destroyed$.unsubscribe();
  }

  get currentMonth() {
    return this.monthNames[new Date(this.form.get('date')?.value).getMonth()] || '';
  }

  get maxDays() {
    const month = isMoment(this.form.get('date')?.value)
      ? this.form.get('date')?.value
      : moment(this.form.get('date')?.value);
    return month.daysInMonth() || 31;
  }

  updateCell(updateCell: { cell: IVisitLogCell; index: number }) {
    this.loading = true;
    this.updateVisitItem(updateCell)
      .pipe(takeUntil(this.destroyed$), untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
  }

  private getVisitList(date) {
    this.loading = true;
    this.employeeAttendanceService
      .getVisitList(date)
      .pipe(
        takeUntil(this.destroyed$),
        tap(visitList => {
          this.visitList = visitList;
          this.visitListFiltered = [...this.visitList];
          this.teamList = [
            ...new Set([
              null,
              ...visitList.map(el => {
                const item = el?.termUserInfo?.teamId;
                return isFinite(+item) ? +item : null;
              }),
            ]),
          ];
          this.roleList = [...new Set([null, ...visitList.map(el => el?.termUserInfo?.roleId)])];
          this.applyFilter();
        }),
        untilDestroyed(this)
      )
      .subscribe(
        () => {
          this.loading = false;
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
  }

  private updateVisitItem(updateCell: { cell: IVisitLogCell; index: number }): Observable<IVisitLogCell | null> {
    return this.employeeAttendanceService.updateVisitItem(updateCell.cell).pipe(
      tap(() => {
        const rowIndex = this.visitList.findIndex(
          row => row?.visitLogCells.findIndex(cell => cell.id === updateCell.cell.id) !== -1
        );

        this.visitList[rowIndex].visitLogCells[updateCell.index] = updateCell.cell;
        this.visitList = [...this.visitList];
        this.visitListFiltered = [...this.visitList];

        this.notificationService.showMessage('success', 'Ячейка была успешно изменена.');
      }),
      catchError(() => {
        this.notificationService.showMessage('error', 'Произошла ошибка. Попробуйте изменить еще раз.');
        return of(null);
      })
    );
  }
}
