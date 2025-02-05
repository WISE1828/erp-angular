import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as moment from 'moment/moment';
import { BehaviorSubject, combineLatest, Observable, of, timer } from 'rxjs';
import { map, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IChartData } from '../chart/chart.component';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { ListComponent } from '../shared/components/list/list.component';
import { checkNumber } from '../shared/math/formulas.base';
import { AuthService } from '../shared/services/auth.service';
import { FeeService } from '../shared/services/fee.service';
import { MotivationItem, MotivationsGridService } from '../shared/services/motivations-grid.service';
import { NotificationService } from '../shared/services/notification.service';
import { PercentItem, PercentsGridService } from '../shared/services/percents-grid.service';
import { TrackersService } from '../shared/services/trackers.service';
import { IHelperStatistic, IStatistic, IUserInfo, UserInfoService } from '../shared/services/user-info.service';
import { WorkPerformanceService } from '../shared/services/work-performance.service';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { PaymentInfoComponent } from './payment-info/payment-info.component';
import { TeamLeadPercentGridComponent } from './team-lead-percent-grid/team-lead-percent-grid.component';

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
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
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
export class ProfileComponent implements OnInit {
  public roles = this.auth.rolesList;
  public date: FormControl;
  public isEditing = false;
  public resizeMonthStatusticRounds = false;
  public MAX_VALUE = 9999999;
  public form: FormGroup = new FormGroup({
    email: new FormControl(null, []),
    phoneNumber: new FormControl(null, []),
    telegram: new FormControl(null, []),
    instagram: new FormControl(null, []),
    vkontakte: new FormControl(null, []),
    firstName: new FormControl(null, [Validators.required]),
    lastName: new FormControl(null, [Validators.required]),
    patronymic: new FormControl(null, [Validators.required]),
    roleId: new FormControl(null, []),
    teamId: new FormControl(null, []),
    id: new FormControl(null, []),
    birthday: new FormControl(null, []),
    percentChartId: new FormControl(null),
    bet: new FormControl(null),
    motivationChartId: new FormControl(null),
    prepaidExpense: new FormControl(null),
    agencyProfitPercent: new FormControl(null),
    isRemote: new FormControl(null),
  });
  public role: number;
  public paramsId: string;
  public userId: string;
  public userInfo: any;
  public userInfoEdited: IUserInfo;
  public currentData: any[];
  public statistic: IStatistic | IHelperStatistic;
  public loading = new BehaviorSubject<boolean>(true);
  public baerCurrentMonthProfitLimit = [100000, 350000, 600000];
  public baerPreviousMonthProfitLimit = [20000, 105000, 240000];

  public smartCurrentMonthProfitLimit = [200000];
  public smartPreviousMonthProfitLimit = [40000];

  public percentCharts$: Observable<PercentItem[]> = this.percentsGridService.getItems(
    this.percentsGridService.formatedDate
  );
  public motivationCharts$: Observable<MotivationItem[]> = this.motivationsGridService.getItems(
    this.motivationsGridService.formatedDate
  );
  minDate = moment(localStorage.getItem('created_at')).startOf('month').toDate();

  chartStore = [];
  chartData: IChartData;

  roleTimer = {
    timer$: null,
    seconds: environment.roleTimer,
  };

  budget = 0;

  constructor(
    private userInfoService: UserInfoService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private percentsGridService: PercentsGridService,
    private motivationsGridService: MotivationsGridService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private trackersService: TrackersService,
    private workPerformanceService: WorkPerformanceService,
    private additionalFeeService: FeeService
  ) {}

  includesFn = (arr, el) => arr.map(item => item.id).includes(el);

  get isAdmin() {
    return this.userInfo?.roleId === +this.auth.roles.admin || this.userInfo?.roleId === +this.auth.roles.financier;
  }
  get isAdminOrTeamlead() {
    return [+this.auth.roles.admin, +this.auth.roles.teamlead, +this.auth.roles.financier].includes(
      this.userInfo?.roleId
    );
  }
  get isBayerOrSmart() {
    return [+this.auth.roles.bayer, +this.auth.roles.smart].includes(this.userInfo?.roleId);
  }

  get isBayer() {
    return [+this.auth.roles.bayer].includes(this.userInfo?.roleId);
  }
  get isPersonal() {
    return [
      +this.auth.roles.farmer,
      +this.auth.roles.farmerTeamlead,
      +this.auth.roles.creative,
      +this.auth.roles.techSpecialist,
      +this.auth.roles.teamLeadTechnicalSpecialist,
      +this.auth.roles.teamLeadPromotion,
    ].includes(this.userInfo?.roleId);
  }

  get isFinancier() {
    return [+this.auth.roles.financier].includes(this.userInfo?.roleId);
  }
  get isTeamLeadFarmer() {
    return [+this.auth.roles.farmerTeamlead].includes(this.userInfo?.roleId);
  }
  get isTeamLeadPromotion() {
    return [+this.auth.roles.teamLeadPromotion].includes(this.userInfo?.roleId);
  }
  get isTeamLeadIT() {
    return [+this.auth.roles.teamLeadTechnicalSpecialist].includes(this.userInfo?.roleId);
  }
  get isFarmer() {
    return [+this.auth.roles.farmer].includes(this.userInfo?.roleId);
  }
  get isHelper() {
    return [+this.auth.roles.helper].includes(this.userInfo?.roleId);
  }
  get isCreative() {
    return [+this.auth.roles.creative].includes(this.userInfo?.roleId);
  }
  get isTechSpecialist() {
    return [+this.auth.roles.techSpecialist].includes(this.userInfo?.roleId);
  }

  get isAccessToTrackers() {
    return this.isAdminOrTeamlead || this.isBayerOrSmart || this.isHelper;
  }
  get isAccessToBudget() {
    return this.isAdminOrTeamlead || this.isBayerOrSmart || this.isHelper;
  }
  get isAccessToHelperPercents() {
    return this.isAdmin || this.isBayer;
  }

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.userId = localStorage.getItem('userId');
    this.date = new FormControl(new Date(), []);
    this.route.params.pipe(untilDestroyed(this)).subscribe(({ id }) => {
      this.paramsId = id;
      this.loadUserData$();
      this.getActiveRoleTimer();
    });
    this.userInfoService.date = formatDate(this.date.value, 'dd.MM.yyyy', 'ru');
  }

  getActiveRoleTimer() {
    const nowTimer = new Date().getTime();
    const lastRoleTimer = +localStorage.getItem('roleTimer') || nowTimer;
    const roleTimerId = +localStorage.getItem('roleTimerId');
    if (roleTimerId != +this.paramsId) {
      return undefined;
    }
    const differenceRoleTime = (nowTimer - lastRoleTimer) / 1000;
    if (differenceRoleTime > 0 && differenceRoleTime < this.roleTimer.seconds) {
      this.reloadRoleTimer(Math.ceil(differenceRoleTime));
    }
  }

  getUserData(statisticDate) {
    if (this.isAdminOrTeamlead) {
      return this.userInfoService.getStatisticAdminTeamLead(this.paramsId, statisticDate);
    }
    if (this.isBayerOrSmart) {
      return this.userInfoService.getStatisticOther(this.paramsId, statisticDate);
    }
    if (this.isHelper) {
      return this.userInfoService.getStatisticHelper(this.paramsId, statisticDate);
    }

    if (this.isCreative) {
      return this.userInfoService.getStatisticCreative(this.paramsId, statisticDate);
    }
    if (this.isTechSpecialist) {
      return this.userInfoService.getStatisticTechSpecialist(this.paramsId, statisticDate);
    }
    if (this.isFarmer) {
      return this.userInfoService.getStatisticFarmer(this.paramsId, statisticDate);
    }
    if (this.isTeamLeadFarmer) {
      return this.userInfoService.getStatisticTeamLeadFarmer(this.paramsId, statisticDate);
    }

    if (this.isTeamLeadPromotion) {
      return this.userInfoService.getStatisticTeamLeadPromotion(this.paramsId, statisticDate);
    }
    if (this.isTeamLeadIT) {
      return this.userInfoService.getStatisticTeamLeadTechnicalSpecialist(this.paramsId, statisticDate);
    }

    return of(null);
  }

  loadUserData$() {
    this.loading.next(true);
    this.currentData = [];

    const momentDataObject = this.date.value instanceof Date ? this.date.value : this.date.value.toDate();
    const month = momentDataObject.getMonth();
    const year = momentDataObject.getFullYear();
    const date = +new Date(year, month, 1);
    const statisticDate = formatDate(date, 'dd.MM.yyyy', 'ru');

    this.userInfoService
      .getUserInfo(this.paramsId)
      .pipe(
        tap(user => {
          this.userInfo = user;
        }),
        switchMap(() =>
          combineLatest(this.getUserData(statisticDate), this.loadBudget(this.userInfo?.id, statisticDate))
        ),
        untilDestroyed(this)
      )
      .subscribe(
        ([statistic]) => {
          this.userInfoEdited = Object.assign({}, this.userInfo);
          this.statistic = statistic;
          this.createForm();
          if (
            (this.statistic as IStatistic)?.clearProfitForMonth > this.MAX_VALUE ||
            (this.statistic as IStatistic)?.profitForMonth > this.MAX_VALUE
          ) {
            this.resizeMonthStatusticRounds = true;
          }
          this.fillGraphData();
          this.loading.next(false);
          this.cd.detectChanges();
        },
        () => {
          this.loading.next(false);
          this.statistic = null;
          this.fillGraphData();
          this.notificationService.showMessage('error', 'При обновлении статистики возникла ошибка');
          this.cd.detectChanges();
        }
      );
  }

  loadBudget(userId, date) {
    if (!this.isAccessToBudget) {
      return of(null);
    }
    let action$ = this.workPerformanceService.getBudgetById(userId, date).pipe(map(({ budget }) => budget));
    if (this.isAdmin) {
      action$ = this.workPerformanceService.getList(date).pipe(
        map(data => {
          return data?.reduce((acc, { commonBudget }) => acc + commonBudget, 0) || 0;
        })
      );
    }
    if (this.isTeamLead) {
      action$ = this.workPerformanceService.getList(date).pipe(
        map(data => {
          return (
            data
              ?.filter(({ teamId }) => teamId === this.userInfo?.teamId)
              .reduce((acc, { commonBudget }) => acc + commonBudget, 0) || 0
          );
        })
      );
    }
    return action$.pipe(
      tap(budget => (this.budget = budget || 0)),
      untilDestroyed(this)
    );
  }

  createForm(): void {
    const data = {
      email: this.userInfoEdited?.email,
      phoneNumber: this.userInfoEdited?.phoneNumber,
      telegram: this.userInfoEdited?.telegram,
      instagram: this.userInfoEdited?.instagram,
      vkontakte: this.userInfoEdited?.vkontakte,
      firstName: this.userInfoEdited?.firstName,
      lastName: this.userInfoEdited?.lastName,
      patronymic: this.userInfoEdited?.patronymic,
      roleId: this.userInfoEdited?.roleId,
      teamId: this.userInfoEdited?.teamId,
      id: this.userInfoEdited?.id || 1,
      birthday: this.userInfoEdited?.birthday,
      percentChartId: (this.statistic as IStatistic)?.percentChart?.id,
      bet: (this.statistic as IHelperStatistic)?.fixedSalary,
      motivationChartId: (this.statistic as IHelperStatistic)?.motivationChart?.id,
      prepaidExpense: (this.statistic as IStatistic)?.prepaidExpense,
      agencyProfitPercent: (this.statistic as IStatistic)?.percentOfAgencyClearProfit,
      isRemote: this.userInfoEdited?.isRemote,
    };
    this.form.patchValue(data);

    this.form.get('id').disable();
    this.form.get('email').disable();
    if (this.role !== this.auth.roles.admin) {
      this.form.get('roleId').disable();
      this.form.get('teamId').disable();
    }
  }

  getColor(clearProfit: number, percent: number, month: string): string {
    if (this.userInfo.roleId === 3) {
      return this.getColorBaer(clearProfit, percent, month);
    }
    if (this.userInfo.roleId === 4) {
      return this.getColorSmart(clearProfit, percent, month);
    }
  }

  getColorSmart(clearProfit: number, percent: number, month: string): string {
    const limits = month === 'current' ? this.smartCurrentMonthProfitLimit : this.smartPreviousMonthProfitLimit;
    const value = month === 'current' ? (clearProfit * 100) / percent : clearProfit;
    switch (true) {
      case value < limits[0]:
        return 'percent-group-1';
      case value >= limits[0]:
        return 'percent-group-4';
    }
  }

  getColorBaer(clearProfit: number, percent: number, month: string): string {
    const limits = month === 'current' ? this.baerCurrentMonthProfitLimit : this.baerPreviousMonthProfitLimit;
    const value = month === 'current' ? (clearProfit * 100) / percent : clearProfit;
    switch (true) {
      case value < limits[0]:
        return 'percent-group-1';
      case value >= limits[0] && value < limits[1]:
        return 'percent-group-2';
      case value >= limits[1] && value < limits[2]:
        return 'percent-group-3';
      case value >= limits[2]:
        return 'percent-group-4';
    }
  }

  changePassword(id: string) {
    this.dialog.open(ChangePasswordComponent, {
      data: {
        userId: +id,
      },
    });
  }

  blockUser(id: number) {
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
      data: {
        title: 'Блокировка пользователя',
        content: `Вы действительно хотите заблокировать пользователя`,
        itemName: this.userInfo.firstName + ' ' + this.userInfo.lastName,
        confirmButton: 'Заблокировать',
      },
    });

    confirmDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          this.loading.next(true);
          this.auth
            .blockUser(id)
            .pipe(untilDestroyed(this))
            .subscribe(
              () => {
                this.loadUserData$();
                this.loading.next(false);
                this.notificationService.showMessage('success', 'Пользователь заблокирован');
                this.cd.detectChanges();
              },
              () => {
                this.loading.next(false);
                this.notificationService.showMessage('error', 'При блокировке произошла ошибка');
                this.cd.detectChanges();
              }
            );
        }
        this.cd.detectChanges();
      });
  }

  startEditing(): void {
    this.isEditing = true;
    this.userInfoEdited = Object.assign({}, this.userInfo);
    this.createForm();
  }

  cancelEditing(): void {
    this.form.reset();
    this.isEditing = false;
  }

  submit(): void {
    const oldUserRole = this.userInfo.roleId;
    const userInfo = Object.assign({}, this.userInfo, this.form.value);
    this.isEditing = false;
    this.userInfoService
      .updateUserInfo(this.paramsId, userInfo)
      .pipe(untilDestroyed(this))
      .subscribe(
        response => {
          this.notificationService.showMessage('success', 'Данные успешно обновлены');
          this.userInfoService.userFullName = `${response.firstName} ${response.lastName}`;
          this.userInfo = response;
          const curUserRole = this.userInfo.roleId;
          if (oldUserRole != curUserRole) {
            this.reloadRoleTimer();
          }
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При обновлении данных произошла ошибка');
          this.cd.detectChanges();
        }
      );
  }

  getBonusHelper(profit) {
    const collection = (this.statistic as IHelperStatistic)?.motivationChart?.quantityBonusInfoCollection || [];

    for (let i = 0; i < collection.length; i++) {
      let inRange =
        i === collection.length - 1
          ? profit >= collection[i].quantity
          : profit >= collection[i].quantity && profit < collection[i + 1].quantity;
      if (inRange) {
        return collection[i].bonus || 0;
      }
    }

    return 0;
  }

  get percentChart() {
    return (this.statistic as IStatistic)?.percentChart?.profitPercentInfoCollection?.map(el => el.percent);
  }
  get motivationChart() {
    return (this.statistic as IHelperStatistic)?.motivationChart?.quantityBonusInfoCollection?.map(el => el.bonus);
  }
  get percentChartLastMonth() {
    return (this.statistic as IStatistic)?.percentChartLastMonth?.profitPercentInfoCollection?.map(el => el.percent);
  }
  get motivationChartLastMonth() {
    return (this.statistic as IHelperStatistic)?.motivationChartLastMonth?.quantityBonusInfoCollection?.map(
      el => el.bonus
    );
  }

  checkColor(profit, chartValues) {
    if (!profit || profit <= 0) {
      return this.userInfoService.percentColorsBaer[0];
    }
    for (let i = 0; i < chartValues.length; i++) {
      let inRange =
        i === chartValues.length - 1
          ? profit >= chartValues[i]
          : profit >= chartValues[i] && profit < chartValues[i + 1];

      if (inRange) {
        return this.userInfoService.percentColorsBaer[i] || '#4995e3';
      }
    }
    return '#4995e3';
  }
  fillGraphData(): void {
    this.chartData = null;

    if (this.isAdminOrTeamlead) {
      this.getAdminAndTeamLeadGraphData();
    }
    if (this.isBayerOrSmart) {
      this.getGraphData();
    }
    if (this.isHelper || this.isPersonal) {
      this.getHelperGraphData();
    }
  }
  private getGraphData(): void {
    this.statistic = this.statistic as IStatistic;
    const numbersRoundText = (values, pos) => {
      const value = values[pos];
      const len = values.length - 1;
      const valuePostfix = v => {
        const valueStr = String(v);
        if (v >= 1000 && v < 1000000) {
          return valueStr.slice(0, -3) + 'K';
        }
        if (v >= 1000000) {
          return valueStr.slice(0, -6) + 'M';
        }
        return valueStr;
      };
      if (pos === 0) {
        return '< ' + valuePostfix(values[pos + 1]) || '';
      }
      if (pos != len) {
        return 'от ' + valuePostfix(value) || '';
      }
      return '> ' + valuePostfix(value) || '';
    };

    const self = this;
    const xValues = this.statistic?.percentChart?.profitPercentInfoCollection?.map(({ percent }) => percent) || [];
    const yValues = this.statistic?.percentChart?.profitPercentInfoCollection?.map(({ profit }) => profit) || [];
    const currentValue = this.statistic?.profitForMonth > 0 ? this.statistic?.profitForMonth : 0;
    const data = this.calculateChartAxles(currentValue, xValues, yValues);
    const labels = yValues.map((el, i) => numbersRoundText(yValues, i));
    const formatter = function () {
      const percent = self.userInfo.profitPercent;
      const color =
        self.userInfo?.roleId === self.auth.roles.bayer
          ? self.userInfoService.percentColorsBaer[0]
          : self.userInfoService.percentColorsSmart[0];
      if (percent !== undefined && this.total === percent) {
        return '<div><span style="color:' + color + '">' + this.total + '%' + '</span>' + '</div>';
      } else {
        return '<div><span>' + this.total + '%' + '</span>' + '</div>';
      }
    };
    this.chartStore = [...yValues];

    this.chartData = {
      data,
      labels,
      formatter: formatter,
      xValues,
    };
  }
  private getHelperGraphData(): void {
    const statistic = this.statistic as IHelperStatistic;
    const numbersRoundText = (values, pos) => {
      const value = values[pos];
      const len = values.length - 1;
      const valuePostfix = v => {
        const valueStr = String(v);
        if (v >= 1000 && v < 1000000) {
          return valueStr.slice(0, -3) + 'K';
        }
        if (v >= 1000000) {
          return valueStr.slice(0, -6) + 'M';
        }
        return valueStr;
      };
      if (pos === 0) {
        return 'от ' + valuePostfix(values[pos]) || '';
      }
      if (pos != len) {
        return 'от ' + valuePostfix(value) || '';
      }
      return 'от ' + valuePostfix(value) || '';
    };

    const self = this;
    const xValues = statistic?.motivationChart?.quantityBonusInfoCollection?.map(({ bonus }) => bonus) || [];
    const yValues = statistic?.motivationChart?.quantityBonusInfoCollection?.map(({ quantity }) => quantity) || [];
    const currentValue = statistic?.quantityForMonth > 0 ? statistic?.quantityForMonth : 0;
    const data = this.calculateChartAxles(currentValue, xValues, yValues);
    const labels = yValues.map((el, i) =>
      this.isAdminOrTeamLeadViewOther
        ? numbersRoundText(yValues, i) + ' ' + statistic?.motivationChart?.quantitySign
        : ''
    );
    const formatter = function () {
      const statistic = self.statistic as IHelperStatistic;
      const symbol = statistic?.motivationChart?.bonusSign;
      const percent = statistic?.quantityForMonth;
      const total =
        statistic?.motivationChart?.quantityBonusInfoCollection.find(({ bonus }) => bonus === this.total)?.quantity ||
        0;
      const color = self.userInfoService.percentColorsBaer[0];
      if (percent !== undefined && total === percent) {
        return '<div><span style="color:' + color + '">' + this.total + ' ' + symbol + '</span>' + '</div>';
      } else {
        return '<div><span>' + this.total + ' ' + symbol + '</span>' + '</div>';
      }
    };
    this.chartStore = [...xValues];

    this.chartData = {
      data,
      labels,
      formatter: formatter,
      xValues,
    };
  }
  private getAdminAndTeamLeadGraphData(): void {
    this.statistic = this.statistic as IStatistic;
    let xValues =
      this.statistic?.unitStatistic.sort((a, b) => {
        return a.profit - b.profit;
      }) || [];
    let yValues = [];
    const self = this;
    const colors = this.calculateGraphColors(xValues?.length > 0 ? xValues?.length - 1 : 0);
    const data = xValues.map((el, i) => {
      const label = el.teamId || el.unitId;
      yValues.push(label);
      this.chartStore.push(el.profit);
      return {
        y: el.profit,
        label,
        color: colors[i],
      };
    });
    const formatter = function () {
      const color =
        self.userInfo?.roleId === self.auth.roles.bayer
          ? self.userInfoService.percentColorsBaer[0]
          : self.userInfoService.percentColorsSmart[0];
      return '<div><span style="color:' + color + '">' + Math.round(this.total / 1000) + 'k' + '</span>' + '</div>';
    };
    this.chartData = {
      data,
      labels: yValues,
      xValues,
      formatter,
    };
  }
  private calculateGraphColors(itemsNumber: number = 0): string[] {
    const array = ['#E51A1A', '#E3B04E', '#DFD829', '#51A34F'];
    const step = +(120 / itemsNumber).toFixed(0);
    for (let i = 4; i < itemsNumber; i++) {
      const color = `hsl(${i * step}, 70%, 50%)`;
      array.push(color);
    }
    return array;
  }
  private calculateChartAxles(currentValue: number, xValues: number[], yValues: number[]) {
    const colors = xValues?.map(() => '#DDDDDD') || [];
    return xValues.map((el, i) => {
      const color = colors[i];
      let inRange =
        i === yValues.length - 1
          ? currentValue >= yValues[i]
          : currentValue >= yValues[i] && currentValue < yValues[i + 1];

      return {
        y: el,
        color: !inRange ? color : this.userInfoService.percentColorsBaer[i] || '#4995e3',
      };
    });
  }

  public externalNavigate(flag: string): void {
    switch (flag) {
      case 'inst':
        window.open(`https://www.instagram.com/${this.userInfo.instagram}`, '_blank');
        break;
      case 'vk':
        window.open(this.userInfo.vkontakte, '_blank');
        break;
      case 'telegram':
        this.userInfo.telegram = this.userInfo.telegram.replace('@', '');
        window.open(`https://t.me/${this.userInfo.telegram}`, '_blank');
        break;
    }
  }

  public loadPhoto(e): void {
    const file = e.target.files[0] || e.dataTransfer.files[0];
    const formData = new FormData();
    formData.append('reqFile', file);
    this.userInfoService
      .loadImage(this.userInfo.id, formData)
      .pipe(untilDestroyed(this))
      .subscribe(
        response => {
          this.userInfo.imageUrl = response;
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
  }

  public chosenMonthHandler(normalizedMonth, datepicker): void {
    this.date.setValue(normalizedMonth);
    datepicker.close();
    const momentDataObject = this.date.value.toDate();
    const month = momentDataObject.getMonth();
    const year = momentDataObject.getFullYear();
    const date = new Date(year, month, 1);
    this.loading.next(true);
    this.percentsGridService.filterDate = date;
    this.motivationsGridService.filterDate = date;
    const formatedDate = formatDate(date, 'dd.MM.yyyy', 'ru');
    this.percentCharts$ = this.percentsGridService.getItems(formatedDate);
    this.motivationCharts$ = this.motivationsGridService.getItems(formatedDate);

    this.userInfoService.date = formatedDate;

    combineLatest(
      this.userInfoService.getRoleByUserAndDate(this.userInfo?.id, formatedDate).pipe(untilDestroyed(this)),
      this.loadBudget(this.userInfo?.id, formatedDate)
    )
      .pipe(untilDestroyed(this))
      .subscribe(
        ([roleId]) => {
          this.userInfo.roleId = roleId;
          this.getUserData(formatedDate)
            .pipe(untilDestroyed(this))
            .subscribe(
              response => {
                this.statistic = response;
                this.loading.next(false);
                this.createForm();
                this.fillGraphData();
                this.cd.detectChanges();
              },
              () => {
                this.statistic = null;
                this.fillGraphData();
                this.notificationService.showMessage('error', 'При обновлении статистики возникла ошибка');
                this.loading.next(false);
                this.cd.detectChanges();
              }
            );
        },
        error => {
          this.notificationService.showMessage('error', 'При получении статистики возникла ошибка');
          this.loading.next(false);
          this.cd.detectChanges();
        }
      );
  }

  setMotivationChart() {
    this.loading.next(true);
    const date = new Date(this.date.value).toISOString();
    const motivationChartId = this.form.get('motivationChartId').value;
    return this.motivationsGridService
      .setMotivationChart(+this.paramsId, date, motivationChartId)
      .pipe(take(1), untilDestroyed(this))
      .subscribe(
        () => {
          this.notificationService.showMessage('success', `Сетка успешно назанчена`);
          this.loading.next(false);
          this.userInfo = null;
          this.loadUserData$();
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При назанчении сетки произошла ошибка');
          this.loading.next(false);
          this.cd.detectChanges();
        }
      );
  }
  setBet() {
    const date = formatDate(this.date.value, 'dd.MM.yyyy', 'en');
    const bet = this.form.get('bet').value;
    this.userInfoService
      .changeSalaryByUserIdAndDate(this.paramsId, date, bet)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.notificationService.showMessage('success', `Ставка успешно изменена`);
          this.userInfo = null;
          this.loadUserData$();
        },
        () => {
          this.notificationService.showMessage('error', 'При изменении ставки произошла ошибка');
          this.loading.next(false);
          this.cd.detectChanges();
        }
      );
  }

  setPrepaidExpense() {
    const date = formatDate(this.date.value, 'dd.MM.yyyy', 'en');
    const prepaidExpense = this.form.get('prepaidExpense').value;
    this.userInfoService
      .changePrepaidExpenseByUserIdAndDate(this.paramsId, date, prepaidExpense)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.notificationService.showMessage('success', `Авансы успешно изменены`);
          this.userInfo = null;
          this.loadUserData$();
        },
        () => {
          this.notificationService.showMessage('error', 'При изменении авансов произошла ошибка');
          this.loading.next(false);
          this.cd.detectChanges();
        }
      );
  }

  setAgencyProfitPercent() {
    const date = formatDate(this.date.value, 'dd.MM.yyyy', 'en');
    const agencyProfitPercent = this.form.get('agencyProfitPercent').value;
    this.userInfoService
      .changeAgencyProfitPercentByUserIdAndDate(this.paramsId, date, agencyProfitPercent)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.notificationService.showMessage('success', `Проценты успешно изменены`);
          this.userInfo = null;
          this.loadUserData$();
        },
        () => {
          this.notificationService.showMessage('error', 'При изменении процентов произошла ошибка');
          this.loading.next(false);
          this.cd.detectChanges();
        }
      );
  }

  setPercentChart() {
    const percentChartId = this.form.get('percentChartId').value;

    const action = () => {
      this.loading.next(true);
      return this.setPercent('percentChart', percentChartId)
        .pipe(take(1), untilDestroyed(this))
        .subscribe(
          () => {
            this.notificationService.showMessage('success', `Сетка успешно назанчена`);
            this.loading.next(false);
            this.userInfo = null;
            this.loadUserData$();
          },
          () => {
            this.notificationService.showMessage('error', 'При назанчении сетки произошла ошибка');
            this.loading.next(false);
            this.cd.detectChanges();
          }
        );
    };
    const error = () => {
      this.loading.next(false);
      const percentChart = (this.statistic as IStatistic)?.percentChart;
      if (percentChart) {
        this.form.get('percentChartId').patchValue(percentChart?.id);
      }
      this.cd.detectChanges();
      return;
    };

    this.checkDataPercentChart(action, error);
  }
  setPercent(type: string, payload: any): Observable<any> {
    const actions = {
      percentChart: percentChartId => {
        const date = new Date(this.date.value).toISOString();
        return this.userInfoService.setPercentChart(+this.paramsId, date, percentChartId);
      },
      percentInternship: internshipPercent => {
        const date = formatDate(this.date.value, 'dd.MM.yyyy', 'en');
        return this.percentsGridService.changeCustomInternshipPercent(+this.paramsId, date, internshipPercent);
      },
      percentTeam: teamPercents => {
        const date = formatDate(this.date.value, 'dd.MM.yyyy', 'en');
        return this.percentsGridService.changeCustomLeadPercent(+this.paramsId, date, teamPercents);
      },
      percentOfAgencyClearProfit: percentOfAgency => {
        const date = formatDate(this.date.value, 'dd.MM.yyyy', 'en');
        return this.userInfoService.changeAgencyProfitPercentByUserIdAndDate(this.paramsId, date, percentOfAgency);
      },
    };
    return actions[type](payload);
  }
  checkDataPercentChart(successFn: () => void, errorFn: () => void) {
    const formDate = new Date(this.date.value);
    const nowDate = new Date();
    const invalidMonth = formDate.getMonth() != nowDate.getMonth();
    const invalidYear = formDate.getFullYear() != formDate.getFullYear();
    if (invalidMonth || invalidYear) {
      const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
        autoFocus: false,
        hasBackdrop: true,
        data: {
          title: 'Подтвердите действие',
          content: `Вы пытаетесь изменить сетку не за текущий месяц, продолжить`,
          itemName: '',
          confirmButton: 'Изменить',
        },
      });
      confirmDialogRef
        .afterClosed()
        .pipe(untilDestroyed(this))
        .subscribe(data => {
          if (data) {
            return successFn();
          } else {
            return errorFn();
          }
        });
    } else {
      return successFn();
    }
  }

  get isOthersViewSmart(): boolean {
    return this.role != this.auth.roles.admin && this.userInfo?.roleId === +this.auth.roles.smart;
  }
  get isAdminViewSmart(): boolean {
    return (
      this.role === this.auth.roles.admin &&
      this.userInfo?.roleId === +this.auth.roles.smart &&
      +this.userId !== +this.paramsId
    );
  }
  get isNotAdmin() {
    return this.role != this.auth.roles.admin && this.role != this.auth.roles.financier;
  }

  get isNotFinancier() {
    return this.role != this.auth.roles.financier;
  }
  get isAdminViewOther() {
    return (
      this.role === this.auth.roles.admin &&
      this.userInfo.roleId != this.auth.roles.admin &&
      +this.userId !== +this.paramsId
    );
  }
  get isTeamLead() {
    return this.userInfo?.roleId === +this.auth.roles.teamlead;
  }
  get isAdminOrTeamLeadViewOther() {
    return (
      [this.auth.roles.admin, this.auth.roles.teamlead, this.auth.roles.financier].includes(this.role) &&
      ![this.auth.roles.admin, this.auth.roles.teamlead, this.auth.roles.financier].includes(this.userInfo?.roleId) &&
      +this.userId !== +this.paramsId
    );
  }

  get isCurrentMonth() {
    if (this.date?.value) {
      const nowDate = new Date();
      const curDate = new Date(this.date.value);
      const invalidMonth = curDate.getMonth() != nowDate.getMonth();
      const invalidYear = curDate.getFullYear() != curDate.getFullYear();
      return !invalidMonth && !invalidYear;
    } else {
      return false;
    }
  }

  get isAdditionView() {
    return this.isOthersViewSmart || this.isAdminViewSmart || this.isNotAdmin || this.isAdminViewOther;
  }

  circleRenderFn = index => index;

  get circlesInfo() {
    const data = [
      {
        data: () => ({
          title: 'Чистая прибыль в этом месяце',
          color: this.checkColor((this.statistic as IStatistic)?.profitForMonth, this.percentChart),
          value: (this.statistic as IStatistic)?.clearProfitForMonth,
        }),
        isAccess: this.isBayerOrSmart,
      },
      {
        data: () => ({
          title: 'Чистая прибыль в прошлом месяце',
          color: this.checkColor((this.statistic as IStatistic)?.profitForLastMonth, this.percentChartLastMonth),
          value: (this.statistic as IStatistic)?.clearProfitForLastMonth,
        }),
        isAccess: this.isBayerOrSmart,
      },

      {
        data: () => ({
          title: 'Общий профит агентства в текущем месяце',
          value: (this.statistic as IStatistic)?.profitForMonth,
        }),
        isAccess:
          this.userInfo.roleId === +this.auth.roles.admin || this.userInfo.roleId === +this.auth.roles.financier,
      },
      {
        data: () => ({
          title: 'Общий профит агентства за вчерашний день',
          value: (this.statistic as IStatistic)?.profitForYesterday,
        }),
        isAccess:
          (this.userInfo.roleId === +this.auth.roles.admin || this.userInfo.roleId === +this.auth.roles.financier) &&
          this.isCurrentMonth,
      },
      {
        data: () => ({
          title: 'Профит за вычетом дивидендов',
          color: '#51a34f',
          value: (this.statistic as IStatistic)?.clearProfit,
        }),
        isAccess:
          this.userInfo.roleId === +this.auth.roles.admin || this.userInfo.roleId === +this.auth.roles.financier,
      },
      {
        data: () => ({
          title: 'Финансовый KPI',
          value: (this.statistic as IStatistic)?.profitForMonth || 0,
          maxValue: this.budget || 0,
          color: (this.statistic as IStatistic)?.profitForMonth >= this.budget ? '#51A34F' : '#e3b04e',
          postfix: '%',
        }),
        isAccess: this.isAccessToBudget,
      },

      {
        data: () => ({
          title: 'Общий профит команды в текущем месяце',
          value: (this.statistic as IStatistic)?.profitForMonth,
        }),
        isAccess: this.userInfo.roleId === +this.auth.roles.teamlead,
      },
      {
        data: () => ({
          title: 'Личный профит',
          value: (this.statistic as IStatistic)?.clearProfit,
        }),
        isAccess: this.userInfo.roleId === +this.auth.roles.teamlead,
      },

      {
        data: () => ({
          title: 'Зарплата в этом месяце',
          color: this.checkColor(
            this.getBonusHelper((this.statistic as IHelperStatistic)?.quantityForMonth),
            this.motivationChart
          ),
          value:
            (this.statistic as IHelperStatistic)?.salaryForMonth +
            this.getBonusHelper((this.statistic as IHelperStatistic)?.quantityForMonth),
        }),
        isAccess: this.isHelper || this.isPersonal,
      },
      {
        data: () => ({
          title: 'Зарплата в прошлом месяце',
          color: this.checkColor(
            this.getBonusHelper((this.statistic as IHelperStatistic)?.quantityForLastMonth),
            this.motivationChart
          ),
          value:
            (this.statistic as IHelperStatistic)?.salaryForLastMonth +
            this.getBonusHelper((this.statistic as IHelperStatistic)?.quantityForLastMonth),
        }),
        isAccess: this.isHelper || this.isPersonal,
      },
    ];
    return data
      .filter(({ isAccess }) => isAccess)
      .map(({ data }) => {
        const item = data() as any;
        return { ...item, color: item?.color, value: checkNumber(item?.value, 0) };
      });
  }

  showPaymentInfo() {
    const data: Partial<PaymentInfoComponent> = {
      paymentInfoList: null,
      paymentInfoTypeList: null,
      isAccessToCreate:
        (+this.userId === +this.paramsId ||
          +this.role === +this.auth.roles.admin ||
          +this.role === +this.auth.roles.financier) &&
        this.isCurrentMonth,
      isAccessToDelete:
        [+this.auth.roles.admin, +this.auth.roles.teamlead, +this.auth.roles.financier].includes(+this.role) &&
        this.isCurrentMonth,
      userInfo: this.userInfo,
    };
    this.dialog.open(PaymentInfoComponent, {
      data,
    });
  }

  openTeamLeadPercentGrid() {
    const toPercents = v => {
      const percents = (v || 0) * 100;
      return +percents.toFixed(2);
    };
    let data = {
      isEditable: null,
      loading: null,
      percentChart: null,
    };
    const percentChart = (this.statistic as IStatistic)?.percentChart;
    if (percentChart) {
      data = {
        isEditable: this.isAdminViewOther && this.isCurrentMonth,
        loading: this.loading.asObservable(),
        percentChart: percentChart,
      };
    }
    const dialog = this.dialog.open(TeamLeadPercentGridComponent, {
      data,
    });

    let oldPercentChartInfo = {
      percentChartId: null,
      customInternshipPercent: null,
      percentFromBuyer: null,
      percentFromSmart: null,
      percentFromHelper: null,
      percentOfAgencyClearProfit: null,
      especialPercents: [],
    };

    const statistic: any = (this.statistic as IStatistic) || {};
    if ('customInternshipPercent' in statistic) {
      oldPercentChartInfo = {
        percentChartId: this.form.get('percentChartId').value,
        customInternshipPercent: toPercents(statistic?.customInternshipPercent),
        percentFromBuyer: toPercents(statistic?.customLeadPercent?.percentFromBuyer),
        percentFromSmart: toPercents(statistic?.customLeadPercent?.percentFromSmart),
        percentFromHelper: toPercents(statistic?.customLeadPercent?.percentFromHelper),
        percentOfAgencyClearProfit: toPercents(statistic?.percentOfAgencyClearProfit),
        especialPercents: statistic?.customLeadPercent?.especialPercents || [],
      };
    }

    dialog.componentInstance.createForm(oldPercentChartInfo);

    dialog.componentInstance.percentCharts$ = this.percentCharts$;
    dialog.componentInstance.loading$ = this.loading;
    dialog.componentInstance.saveEvent
      .pipe(untilDestroyed(this))
      .subscribe(
        ({
          percentChartId,
          percentInternship,
          percentBayer,
          percentSmart,
          percentHelper,
          percentOfAgencyClearProfit,
        }) => {
          const teamPercents = {
            percentFromBuyer: percentBayer / 100,
            percentFromSmart: percentSmart / 100,
            percentFromHelper: percentHelper / 100,
          };
          const internshipPercent = percentInternship / 100;
          const agencyClearProfitPercent = percentOfAgencyClearProfit / 100;

          const actions: Observable<any>[] = [];

          const isPercentInternship = percentInternship !== oldPercentChartInfo.customInternshipPercent;
          const isAgencyClearProfitPercent =
            percentOfAgencyClearProfit !== oldPercentChartInfo.percentOfAgencyClearProfit;
          const isPercentsLead =
            percentBayer != oldPercentChartInfo.percentFromBuyer ||
            percentSmart !== oldPercentChartInfo.percentFromSmart ||
            percentHelper !== oldPercentChartInfo.percentFromHelper;
          const isPercentChart = +percentChartId !== oldPercentChartInfo.percentChartId;

          const isNoChanges = !isPercentInternship && !isPercentsLead && !isPercentChart && !isAgencyClearProfitPercent;

          actions.push(isPercentInternship ? this.setPercent('percentInternship', internshipPercent) : of(null));
          actions.push(
            isAgencyClearProfitPercent
              ? this.setPercent('percentOfAgencyClearProfit', +agencyClearProfitPercent)
              : of(null)
          );
          actions.push(isPercentsLead ? this.setPercent('percentTeam', teamPercents) : of(null));
          actions.push(isPercentChart ? this.setPercent('percentChart', +percentChartId) : of(null));
          if (isNoChanges) {
            dialog.close();
            return;
          }

          const action = () => {
            return actions[0]
              .pipe(
                actions[1] ? switchMap(() => actions[1]) : map(el => el),
                actions[2] ? switchMap(() => actions[2]) : map(el => el),
                actions[3] ? switchMap(() => actions[3]) : map(el => el),
                actions[4] ? switchMap(() => actions[4]) : map(el => el),
                untilDestroyed(this)
              )
              .subscribe(
                () => {
                  this.notificationService.showMessage('success', `Сетка успешно назанчена`);
                  this.loading.next(false);
                  this.userInfo = null;
                  dialog.close();
                  this.loadUserData$();
                },
                () => {
                  this.notificationService.showMessage('error', 'При назанчении сетки произошла ошибка');
                  this.loading.next(false);
                  this.cd.detectChanges();
                }
              );
          };
          const error = () => {
            this.loading.next(false);
            const percentChart = (this.statistic as IStatistic)?.percentChart;
            if (percentChart) {
              this.form.get('percentChartId').patchValue(percentChart?.id);
            }
            this.cd.detectChanges();
            return;
          };

          this.checkDataPercentChart(action, error);
        }
      );
  }

  reloadRoleTimer(startTime?: number) {
    localStorage.setItem('roleTimer', '' + (new Date().getTime() - (startTime ? startTime * 1000 : 0)));
    localStorage.setItem('roleTimerId', '' + this.paramsId);
    let time = startTime ? this.roleTimer.seconds - startTime : this.roleTimer.seconds;
    this.roleTimer.timer$ = timer(0, 1000).pipe(
      map(i => time - i),
      takeWhile(i => i >= 0)
    );
  }

  showReport() {
    this.dialog.open(ListComponent, {
      autoFocus: false,
      hasBackdrop: true,
      data: {
        items: [
          {
            name: 'Сверка оборотных средств',
            action: date => this.userInfoService.saveReconciliationReport(date),
          },
          {
            name: 'Отчет по заработной плате',
            action: date => this.userInfoService.saveSalaryReport(date),
          },
        ],
      },
    });
  }

  showTrackers() {
    this.trackersService.showDialog();
  }

  showBudget() {
    this.workPerformanceService.showDialog();
  }

  showHelperPercents() {
    this.additionalFeeService.showDialog();
  }
}
