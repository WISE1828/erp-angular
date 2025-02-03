import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as moment from 'moment';
import { combineLatest } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import {
  ControlType,
  DataTable,
  DataTableActions,
  FilterOptions,
  FilterTarget,
  ValueType,
} from '../../shared/components/data-table/data-table.models';
import { oldTableBeforeDate } from '../../shared/constants';
import { parseByType, parseNumberWithPrefix } from '../../shared/helpers';
import { IEmptyUser } from '../../shared/interfaces/empty-user.interface';
import { checkNumber } from '../../shared/math/formulas.base';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { IUserInfo, UserInfoService } from '../../shared/services/user-info.service';
import { WorkPerformanceService } from '../../shared/services/work-performance.service';
import { FinancesService, IDailyRoiData, IDailyRoiItem, IRefunds } from '../finances.service';

@UntilDestroy()
@Component({
  selector: 'app-personal-finances',
  templateUrl: './personal-finances.component.html',
  styleUrls: ['./personal-finances.component.scss', '../finances.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalFinancesComponent implements OnInit {
  public date = new Date();
  public avrUsdRub: number;
  public monthDay: number;

  public form: FormGroup;
  public filters: any;
  public currentProfitPercent: number;
  public taxForm: FormGroup = new FormGroup({
    accountsTax: new FormControl(null, []),
    accountsTaxUsd: new FormControl(null, []),
    slices: new FormControl(null, []),
    comissionTax: new FormControl(0, []),
    comissionTaxUsd: new FormControl(0, []),
    prepaidExpense: new FormGroup({
      value: new FormControl(null),
      oldValue: new FormControl(null),
      isEdit: new FormControl(false),
      isLoading: new FormControl(false),
      isError: new FormControl(false),
    }),
  });
  public refundsForm: FormGroup = new FormGroup({
    refundRUB: new FormControl(0),
    refundUSD: new FormControl(0),
    refundEUR: new FormControl(0),
  });
  public campaignOne: FormGroup;
  public receivedData: IDailyRoiItem[] = [];
  public currentItems: IDailyRoiItem[] = [];
  public showInputs = false;
  public role: number;
  public teamId: number;
  public userId: string;
  public paramsId: string;
  public showBackButton: boolean;
  public accountsTax: number;
  public accountsTaxUsd: number;
  public slices: number;
  public comissionTax: number;
  public comissionTaxUsd: number;
  public commission: number;
  public user: IUserInfo | IEmptyUser;
  public loading = false;
  public editingComission = false;
  public editingAccounts = false;
  public termId: number;
  public taxLoading = false;
  public taxError = false;
  public accountComment: string;
  public comissionComment: string;
  public comissionTaxName = 'comissionTax';
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
  refunds = [];
  budget = 0;
  bufferResponse: IDailyRoiData[];
  isActive: boolean;
  negativeProfit: number;

  // ACCESS
  get isAdmin() {
    return this.role === this.auth.roles.admin;
  }
  get isTeamLead() {
    return this.role === this.auth.roles.teamlead;
  }

  public get isHelper(): boolean {
    return this.role === this.auth.roles.helper;
  }

  public get isFinancier(): boolean {
    return this.role === this.auth.roles.financier;
  }

  canEditUsdRub(): boolean {
    return this.isAdmin || this.isFinancier;
  }

  constructor(
    private financesService: FinancesService,
    private userInfoService: UserInfoService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private workPerformanceService: WorkPerformanceService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  parseDataById(data) {
    if (data) {
      this.currentItems = data;
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.role = +localStorage.getItem('role');
    this.userId = localStorage.getItem('userId');

    const queryParams = this.route.snapshot.queryParams;
    const params = this.route.snapshot.params;
    this.filters = { ...queryParams };
    this.paramsId = params.id;
    if (queryParams['return'] === 'yes') {
      this.showBackButton = true;
      this.filters = { ...this.filters, return: undefined };
    }

    this.userInfoService
      .getUserInfo(this.paramsId)
      .pipe(
        tap(user => {
          this.user = user || {
            id: +this.paramsId,
            lastName: 'Not',
            firstName: 'Found',
            teamId: null,
          };

          const startDate = moment(this.filters?.startDate);

          if ((this.isAdmin || this.isFinancier) && startDate.isBefore(oldTableBeforeDate)) {
            this.setDataTableOld();
          } else {
            this.setDataTable();
          }

          // this.setDataTable();
          this.loading = false;
          this.cd.detectChanges();
        }),
        untilDestroyed(this)
      )
      .subscribe(
        undefined,
        error =>
          (this.user = {
            id: +this.paramsId,
            lastName: 'Not',
            firstName: 'Found',
            teamId: null,
          })
      );

    this.form = new FormGroup({
      date: new FormControl(null, []),
      profitFrom: new FormControl(null, []),
      profitTo: new FormControl(null, []),
    });
    this.refundSelect();
  }

  filtersAndDateChange(value: any): void {
    this.activeFilers = value;

    this.filters.startDate = moment(value[0].control.value.startDate).format('DD.MM.YYYY');
    this.filters.endDate = moment(value[0].control.value.endDate).format('DD.MM.YYYY');

    const startDate = moment(value[0].control.value.startDate);

    if ((this.isAdmin || this.isFinancier) && startDate.isBefore(oldTableBeforeDate)) {
      this.setDataTableOld();
    } else {
      this.setDataTable();
    }
  }

  get returnFilters() {
    return Object.keys(this.filters)?.reduce((acc, key) => {
      const filter = this.filters[key];
      acc[key] = filter;
      if (filter?.includes(FilterTarget.FRONT)) {
        acc[key] = acc[key].replace(FilterOptions.SKIP, '');
      }
      return acc;
    }, {});
  }

  loadBudgets(date) {
    return this.workPerformanceService.getBudgetById(this.paramsId, date).pipe(
      shareReplay(1),
      map(({ budget }) => (this.budget = budget || 0)),
      tap(() => this.cd.detectChanges()),
      catchError(() => {
        return null;
      })
    );
  }

  // SHARED
  public filterProfit(): void {
    const profitFrom = this.form.get('profitFrom').value;
    const profitTo = this.form.get('profitTo').value;
    this.currentItems = this.receivedData;
    if (profitFrom && profitTo) {
      this.currentItems = this.currentItems.filter(el => {
        return +el.profit > +profitFrom && +el.profit < +profitTo;
      });
    }
    if (profitFrom && !profitTo) {
      this.currentItems = this.currentItems.filter(el => {
        return +el.profit > +profitFrom;
      });
    }
    if (!profitFrom && profitTo) {
      this.currentItems = this.currentItems.filter(el => {
        return +el.profit < +profitTo;
      });
    }
  }
  private closeProfitDropdown(): void {
    this.showInputs = false;
    if (this.form.value.profitFrom || this.form.value.profitTo) {
      this.dataTableInstance.getParams();
    }
  }
  public onClickedOutside(target): void {
    if (
      !target.classList.contains('input-value-block') &&
      !target.classList.contains('input-value') &&
      !target.classList.contains('profit-inputs')
    ) {
      this.closeProfitDropdown();
    }
  }
  public clickOnInputs(target): void {
    if (
      target.classList.contains('input-value-block') ||
      target.classList.contains('input-value') ||
      target.classList.contains('profit-inputs')
    ) {
      if (this.showInputs) {
        this.closeProfitDropdown();
      } else {
        this.showInputs = true;
      }
    }
  }

  // DAILY ROI
  private updateDailyROI(response: IDailyRoiData[]): void {
    this.bufferResponse = response;
    this.isActive = this.isAdmin || response[0]?.isActive;
    if (response.length) {
      const profitPercent = response.reduce((acc, { profitPercent }) => {
        return acc + profitPercent;
      }, 0);

      this.currentProfitPercent = profitPercent;
      let data = this.setTaxes(response);
      data = data.map(el => ({
        ...el,
        profit: this.financesService.getProfit(el),
        roi: this.financesService.getRoi(data, el),
      }));
      this.accountComment = response[0].termTax.accountComment;
      this.comissionComment = response[0].termTax.comissionComment;
      this.receivedData = data;
      this.currentItems = data;
      this.termId = response.length === 1 ? response[0].termId : null;

      const prepaidExpense = response.reduce((acc, { prepaidExpense }) => {
        return acc + prepaidExpense;
      }, 0);

      this.taxForm = new FormGroup({
        accountsTax: new FormControl(this.accountsTax, []),
        accountsTaxUsd: new FormControl(this.accountsTaxUsd, []),
        slices: new FormControl(this.slices, []),
        comissionTax: new FormControl(this.comissionTax, []),
        comissionTaxUsd: new FormControl(this.comissionTaxUsd, []),
        prepaidExpense: new FormGroup({
          value: new FormControl(prepaidExpense),
          oldValue: new FormControl(prepaidExpense),
          isEdit: new FormControl(false),
          isLoading: new FormControl(false),
          isError: new FormControl(false),
        }),
      });

      if (response.length <= 1) {
        this.refunds = response[0].refunds;
        this.refundsForm = new FormGroup({
          refundRUB: new FormControl(0),
          refundUSD: new FormControl(0),
          refundEUR: new FormControl(0),
        });
      } else {
        const refundItem = response.reduce(
          (acc, { refunds }) => {
            acc['refundRUB'] += refunds?.reduce((acc, el) => acc + (el?.refundRUB || 0), 0);
            acc['refundUSD'] += refunds?.reduce((acc, el) => acc + (el?.refundUSD || 0), 0);
            acc['refundEUR'] += refunds?.reduce((acc, el) => acc + (el?.refundEUR || 0), 0);
            acc['date'] = refunds.slice(-1)[0]?.date;
            return acc;
          },
          { refundRUB: 0, refundUSD: 0, refundEUR: 0 }
        );
        this.refunds = [refundItem];
        this.refundsForm = new FormGroup({
          refundRUB: new FormControl(refundItem?.refundRUB || 0),
          refundUSD: new FormControl(refundItem?.refundUSD || 0),
          refundEUR: new FormControl(refundItem?.refundEUR || 0),
        });
      }
    } else {
      this.currentItems = [];
      this.currentProfitPercent = null;
    }
  }

  // TABLE

  daysInMonth(anyDateInMonth: Date) {
    return new Date(anyDateInMonth.getFullYear(), anyDateInMonth.getMonth() + 1, 0).getDate();
  }

  middleUsdRub() {
    let sum = 0;
    for (let item of this.currentItems) {
      sum += item.usdRub;
    }

    let avrUsdRub = sum / this.currentItems.length;
    return avrUsdRub;
  }

  get totalComissionTax() {
    if (!this.avrUsdRub) {
      this.avrUsdRub = this.middleUsdRub();
    }
    let t = new Date(this.dataTableInstance.dataSource._data._value[0].date);
    let dayInCurrentMonth = this.daysInMonth(t);

    let mean = this.comissionTax / dayInCurrentMonth;
    let meanUsd = this.comissionTaxUsd / dayInCurrentMonth;

    let meanAccounts = this.accountsTax / dayInCurrentMonth;
    let meanAccountsUsd = this.accountsTaxUsd / dayInCurrentMonth;

    this.monthDay = dayInCurrentMonth;

    for (let i = 0; i < this.monthDay; i++) {
      if (i < this.currentItems.length) {
        this.currentItems[i].comissionTax = mean.valueOf();
        this.currentItems[i].comissionTaxUsd = meanUsd.valueOf();

        this.currentItems[i].accountsTax = meanAccounts.valueOf();
        this.currentItems[i].accountsTaxUsd = meanAccountsUsd.valueOf();
      } else {
        let item = this.currentItems[0];
        const itemCopy = { ...item };

        itemCopy.comissionTax = 0;
        itemCopy.comissionTaxUsd = 0;

        itemCopy.accountsTax = 0;
        itemCopy.accountsTaxUsd = 0;

        itemCopy.spent = 0;
        itemCopy.spentUSD = 0;

        itemCopy.consumables = 0;
        itemCopy.consumablesUSD = 0;

        itemCopy.incomeRUB = 0;
        itemCopy.incomeUSD = 0;
        itemCopy.incomeEUR = 0;

        itemCopy.profit = 0;

        itemCopy.roi = 0;

        // itemCopy.usdRub = 0

        this.currentItems.push(itemCopy);
      }
    }
    return this.currentItems.reduce((acc, { comissionTax }) => comissionTax + acc, 0);
  }
  get totalComissionTaxUSD() {
    return this.currentItems.reduce((acc, { comissionTaxUsd }) => comissionTaxUsd + acc, 0);
    // return this.comissionTaxUsd
  }

  get totalComission() {
    return this.currentItems.reduce((acc, { commission }) => commission + acc, 0);
  }

  get totalAccountTax() {
    return this.currentItems.reduce((acc, { accountsTax }) => accountsTax + acc, 0);
  }
  get totalAccountTaxUSD() {
    return this.currentItems.reduce((acc, { accountsTaxUsd }) => accountsTaxUsd + acc, 0);
  }
  get totalConsumables(): number {
    return this.currentItems.reduce((acc, { consumables, accountsTax }) => consumables + accountsTax + acc, 0) || 0;
  }
  get totalConsumablesUSD(): number {
    return (
      this.currentItems.reduce((acc, { consumablesUSD, accountsTaxUsd }) => consumablesUSD + accountsTaxUsd + acc, 0) ||
      0
    );
  }
  get totalIncome(): number {
    return this.currentItems.reduce((acc, { incomeRUB }) => incomeRUB + acc, 0) || 0;
  }
  get totalIncomeUSD(): number {
    return this.currentItems.reduce((acc, { incomeUSD }) => incomeUSD + acc, 0) || 0;
  }
  get totalIncomeEUR(): number {
    return this.currentItems.reduce((acc, { incomeEUR }) => incomeEUR + acc, 0) || 0;
  }
  get totalSpent(): number {
    let value = null;
    this.currentItems.forEach(el => {
      value = value + el.spent + el.comissionTax;
    });
    return value || 0;
  }
  get totalSpentUSD(): number {
    let value = null;
    this.currentItems.forEach(el => {
      value = value + el.spentUSD + el.comissionTaxUsd;
    });
    return value || 0;
  }

  get avrUSD() {
    // console.log(this.avrUsdRub)
    return this.currentItems.reduce((a, c) => a + this.avrUsdRub, 0) / this.currentItems.length;
  }
  get avrEUR() {
    return this.currentItems.reduce((a, c) => a + c.eurRub, 0) / this.currentItems.length;
  }
  get consumablesToRub() {
    return this.totalConsumables + this.totalConsumablesUSD * this.avrUSD;
  }
  get spendsToRub() {
    return this.totalSpent + this.totalSpentUSD * this.avrUSD;
  }
  get incomeToRub() {
    return this.totalIncome + this.totalIncomeUSD * this.avrUSD + this.totalIncomeEUR * this.avrEUR;
  }

  get profit(): number {
    return this.currentItems.reduce((acc, { profit }) => profit + acc, 0) || 0;
  }
  get profitMinus(): number {
    return this.currentItems.reduce((acc, { profitMinus }) => profitMinus + acc, 0) || 0;
  }

  get totalProfitAsBackend(): number {
    let taxes = null;
    this.currentItems.forEach(el => {
      // taxes = taxes + el.comissionTaxUsd * this.avrUSD + el.comissionTax + el.accountsTax + el.accountsTaxUsd * this.avrUSD;
      // taxes = taxes + el.comissionTaxUsd + el.comissionTax + el.accountsTax + el.accountsTaxUsd;
      taxes = taxes + el.commission + el.accountsTax + el.accountsTaxUsd;
    });

    // return this.totalIncomeCPA + this.totalIncomeAgency - this.totalSpentUSDnewCommission - this.totalConsumablesUSD;
    return (
      this.totalIncome +
      this.totalIncomeUSD * this.avrUSD +
      this.totalIncomeEUR * this.avrEUR -
      (this.totalSpent + this.totalSpentUSD * this.avrUSD) -
      (this.totalConsumables + this.totalConsumablesUSD * this.avrUSD)
    );

    // return (this.totalIncomeUSD - this.totalSpentUSD - this.totalConsumablesUSD) * this.avrUSD
    // return this.profit + this.refundsToRub - taxes;
  }

  get totalProfitAsBackendMinus(): number {
    let taxes = null;
    this.currentItems.forEach(el => {
      // taxes = taxes + el.comissionTaxUsd * this.avrUSD + el.comissionTax + el.accountsTax + el.accountsTaxUsd * this.avrUSD;
      // taxes = taxes + el.comissionTaxUsd + el.comissionTax + el.accountsTax + el.accountsTaxUsd;
      taxes = taxes + el.commission + el.accountsTax + el.accountsTaxUsd;
    });

    // return this.totalIncomeCPA + this.totalIncomeAgency - this.totalSpentUSDnewCommission - this.totalConsumablesUSD;
    return (
      this.totalIncome +
      this.totalIncomeUSD * this.avrUSD +
      this.totalIncomeEUR * this.avrEUR -
      (this.totalSpent + this.totalSpentUSD * this.avrUSD) -
      (this.totalConsumables + this.totalConsumablesUSD * this.avrUSD)
    );

    // return (this.totalIncomeUSD - this.totalSpentUSD - this.totalConsumablesUSD) * this.avrUSD
    // return this.profit + this.refundsToRub - taxes;
  }

  get totalProfitAsBackendOld(): number {
    let taxes = null;
    this.currentItems.forEach(el => {
      taxes =
        taxes + el.comissionTaxUsd * this.avrUSD + el.comissionTax + el.accountsTax + el.accountsTaxUsd * this.avrUSD;
    });

    // return this.totalIncomeUSD - this.totalSpentUSD - this.totalConsumablesUSD;
    return (
      this.totalIncome +
      this.totalIncomeUSD * this.avrUSD +
      this.totalIncomeEUR * this.avrEUR -
      (this.totalSpent + this.totalSpentUSD * this.avrUSD) -
      (this.totalConsumables + this.totalConsumablesUSD * this.avrUSD)
    );

    // return (this.totalIncomeUSD - this.totalSpentUSD - this.totalConsumablesUSD) * this.avrUSD
    // return this.profit + this.refundsToRub - taxes;
  }

  get refundsToRub() {
    const refundRUB = (this.refunds?.length && this.refunds.reduce((a, c) => a + c.refundRUB, 0)) || 0;
    const refundUSD = (this.refunds?.length && this.refunds.reduce((a, c) => a + c.refundUSD, 0)) || 0;
    const refundEUR = (this.refunds?.length && this.refunds.reduce((a, c) => a + c.refundEUR, 0)) || 0;
    return refundRUB + refundUSD * this.avrUSD + refundEUR * this.avrEUR;
  }

  // FORMULAS
  get income() {
    return this.incomeToRub + this.refundsToRub;
  }
  get expose() {
    return this.spendsToRub + this.consumablesToRub;
  }
  get getTotalRoi(): number {
    return checkNumber((this.getTotalProfit / this.expose) * 100, 0);
  }

  get getTotalRoiOld(): number {
    return checkNumber((this.getTotalProfitOld / this.expose) * 100, 0);
  }

  get getTotalRoiMinus(): number {
    return checkNumber((this.getTotalProfit / this.expose) * 100, 0);
  }
  get getTotalProfit(): number {
    return this.totalProfitAsBackend;
  }

  get getTotalProfitMinus(): number {
    return this.totalProfitAsBackendMinus;
  }

  get getTotalProfitOld(): number {
    return this.totalProfitAsBackendOld;
    // return this.totalProfitAsBackend;
    //return checkNumber(this.income - this.expose, 0);
  }

  get getResultMoney(): number {
    let result = 0;
    let percent = 0;
    this.currentItems.forEach(el => {
      const comissionTax = checkNumber(el.comissionTax + el.comissionTaxUsd * el.usdRub, 0);
      const profit = checkNumber(el.profit, 0);
      const accountsTax = checkNumber(el.accountsTax + el.accountsTaxUsd * el.usdRub, 0);
      const clearProfit = checkNumber(el.isInternship ? 0 : profit - comissionTax - accountsTax, 0);
      result += (clearProfit * el.profitPercent) / 100;
      percent += el.profitPercent;
    });
    percent = percent / this.currentItems.length / 100;
    return checkNumber(result + this.refundsToRub * percent, 0);
  }

  // REFUNDS
  get refundsViewTotal() {
    const refundRUB = (this.refunds?.length && this.refunds.reduce((a, c) => a + c.refundRUB, 0)) || 0;
    const refundUSD = (this.refunds?.length && this.refunds.reduce((a, c) => a + c.refundUSD, 0)) || 0;
    const refundEUR = (this.refunds?.length && this.refunds.reduce((a, c) => a + c.refundEUR, 0)) || 0;
    return (
      parseFloat(refundRUB).toFixed(2) +
      ' ₽ / ' +
      parseFloat(refundUSD).toFixed(2) +
      ' $ / ' +
      parseFloat(refundEUR).toFixed(2) +
      ' €'
    );
  }
  public updateRefunds(refunds: IRefunds) {
    const selectedId = this.selectedItemId;
    const selectedDate = this.currentItems.find(el => el.id === selectedId)?.date;
    this.loading = true;
    this.financesService
      .updateRefunds(+this.termId, refunds, selectedDate)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.refundSelect();
          // this.getData();
          this.cd.detectChanges();
        },
        () => {
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }
  get refundsView() {
    return (
      this.refundsForm.get('refundRUB').value +
      ' ₽ / ' +
      this.refundsForm.get('refundUSD').value +
      ' $ / ' +
      this.refundsForm.get('refundEUR').value +
      ' €'
    );
  }
  get refundItems() {
    return [
      { name: 'refundRUB', value: this.refundsForm.get('refundRUB').value, postfix: '₽' },
      { name: 'refundUSD', value: this.refundsForm.get('refundUSD').value, postfix: '$' },
      { name: 'refundEUR', value: this.refundsForm.get('refundEUR').value, postfix: '€' },
    ];
  }
  refundSelect(selectedId = this.selectedItemId) {
    let refunds;
    if (selectedId) {
      const selectedDate = this.currentItems.find(el => el.id === selectedId)?.date;
      const refund =
        selectedDate &&
        this.refunds.find(el => {
          const d1 = formatDate(el.date, 'dd.MM.yyyy', 'ru');
          const d2 = formatDate(selectedDate, 'dd.MM.yyyy', 'ru');
          return d1 === d2;
        });
      refunds = {
        refundRUB: refund?.refundRUB || 0,
        refundUSD: refund?.refundUSD || 0,
        refundEUR: refund?.refundEUR || 0,
      };
      this.refundsForm = this.fb.group(refunds);
      this.refundsForm.updateValueAndValidity();
      this.cd.detectChanges();
    }
  }

  // COMISIONS
  get commissionView() {
    return this.taxForm.get('comissionTax').value + ' ₽ / ' + this.taxForm.get('comissionTaxUsd').value + ' $';
  }
  get commissionItems() {
    return [
      { name: 'comissionTax', value: this.taxForm.get('comissionTax').value, postfix: '₽' },
      { name: 'comissionTaxUsd', value: this.taxForm.get('comissionTaxUsd').value, postfix: '$' },
    ];
  }
  get commissionToRub() {
    const avgUsdRub = this.currentItems.reduce((a, c) => a + c.usdRub, 0) / this.currentItems.length;
    return this.taxForm.get('comissionTax').value + this.taxForm.get('comissionTaxUsd').value * avgUsdRub;
  }
  public updateCommissions(commissions: { comissionTax: number; comissionTaxUsd: number }) {
    this.taxForm.patchValue(commissions);
    if (this.bufferResponse?.length) {
      const { comissionTax, comissionTaxUsd } = this.taxForm.value;
      this.bufferResponse[0].termTax = { ...this.bufferResponse[0].termTax, comissionTax, comissionTaxUsd };
      this.updateDailyROI(this.bufferResponse);
    }
    this.saveEditingTax();
  }

  // ACCOUТS TAXES
  get accountsTaxView() {
    // return this.taxForm.get('accountsTax').value + ' ₽ / ' + this.taxForm.get('accountsTaxUsd').value + ' $';
    return this.taxForm.get('accountsTaxUsd').value + ' $';
  }
  get slicesView() {
    // return this.taxForm.get('accountsTax').value + ' ₽ / ' + this.taxForm.get('accountsTaxUsd').value + ' $';
    return this.taxForm.get('slices').value + ' $';
  }

  get accountsTaxItems() {
    return [
      // { name: 'accountsTax', value: this.taxForm.get('accountsTax').value, postfix: '₽' },
      { name: 'accountsTaxUsd', value: this.taxForm.get('accountsTaxUsd').value, postfix: '$' },
    ];
  }

  get slicesTaxItems() {
    return [{ name: 'slices', value: this.taxForm.get('slices').value, postfix: '$' }];
  }

  public updateAccountsTax(accountsTax: { accountsTax: number; accountsTaxUsd: number }) {
    this.taxForm.patchValue(accountsTax);
    if (this.bufferResponse?.length) {
      const { accountsTax, accountsTaxUsd } = this.taxForm.value;
      this.bufferResponse[0].termTax = { ...this.bufferResponse[0].termTax, accountsTax, accountsTaxUsd };
      this.updateDailyROI(this.bufferResponse);
    }
    this.saveEditingTax();
  }

  public addSlices(slices: { slices: number }) {
    this.taxForm.patchValue(slices);
    if (this.bufferResponse?.length) {
      const { slices } = this.taxForm.value;
      this.bufferResponse[0].termTax = { ...this.bufferResponse[0].termTax, slices };
      this.updateDailyROI(this.bufferResponse);
    }
    this.saveEditingTax();
  }

  // TAXES
  private setTaxes(response: IDailyRoiData[]): any {
    const data = [];
    this.comissionTax = null;
    this.accountsTax = null;
    this.accountsTaxUsd = null;
    this.comissionTaxUsd = null;
    response.forEach(el => {
      el.dailyRoiDtos.forEach(item => {
        item['accountsTax'] = el.termTax.accountsTax / el.dailyRoiTermCount;
        item['accountsTaxUsd'] = el.termTax.accountsTaxUsd / el.dailyRoiTermCount;
        item['comissionTax'] = el.termTax.comissionTax / el.dailyRoiTermCount;
        item['comissionTaxUsd'] = el.termTax.comissionTaxUsd / el.dailyRoiTermCount;
        item['slices'] = el.termTax.slices;
        item['dailyRoiTermCount'] = el.dailyRoiTermCount;
        data.push(item);
      });
      this.comissionTax = this.comissionTax + el.termTax.comissionTax;
      this.comissionTaxUsd = this.comissionTaxUsd + el.termTax.comissionTaxUsd;
      this.accountsTax = this.accountsTax + el.termTax.accountsTax;
      this.accountsTaxUsd = this.accountsTaxUsd + el.termTax.accountsTaxUsd;
      this.slices = this.slices + el.termTax.slices;
    });
    return data;
  }
  public editTax(name: string): void {
    if (name === 'comissionTax') {
      this.editingComission = true;
    } else {
      this.editingAccounts = true;
    }
  }
  public saveEditingTax(): void {
    this.taxLoading = true;
    this.comissionTax = this.taxForm.get('comissionTax').value;
    this.accountsTax = this.taxForm.get('accountsTax').value;
    this.accountsTaxUsd = this.taxForm.get('accountsTaxUsd').value;
    this.comissionTaxUsd = this.taxForm.get('comissionTaxUsd').value;
    this.slices = this.taxForm.get('slices').value;
    const tax = {
      comissionTax: this.comissionTax,
      accountsTax: this.accountsTax,
      accountsTaxUsd: this.accountsTaxUsd,
      comissionTaxUsd: this.comissionTaxUsd,
      slices: this.slices,
    };
    // this.receivedData.forEach(el => {
    //   el['accountsTax'] = this.accountsTax / el.dailyRoiTermCount;
    //   el['accountsTaxUsd'] = this.accountsTaxUsd / el.accountsTaxUsd;
    //   el['comissionTax'] = this.comissionTax / el.dailyRoiTermCount;
    //   el['comissionTaxUsd'] = this.comissionTaxUsd / el.dailyRoiTermCount;
    // });
    this.financesService
      .updateTax(this.termId, tax)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          // this.getData();
          this.setDataTable();
          this.taxLoading = false;
          this.editingAccounts = false;
          this.editingComission = false;
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При обновлении комиссии произошла ошибка');
          this.taxError = true;
          this.editingAccounts = false;
          this.editingComission = false;
          this.cd.detectChanges();
        }
      );
  }
  public cancelEditingTax(name: string): void {
    if (name === this.comissionTaxName) {
      this.editingComission = false;
    } else {
      this.editingAccounts = false;
    }
    this.taxForm.get(name).setValue(this[name]);
  }

  get differenceDate() {
    const start = this.activeFilers[0]?.control?.value['startDate'];
    const end = this.activeFilers[0]?.control?.value['endDate'];
    if (!start || !end) {
      return undefined;
    }
    return moment.duration(end.diff(start));
  }

  @ViewChild(DataTableComponent)
  set stateChange(changes) {
    this.dataTableInstance = changes;
    this.cellContent = changes?.content;
  }
  dataTableInstance;
  public cellContent: any = {};
  public activeFilers = {};
  public dataTableConfig: DataTable<any>;
  public selectedItemId;
  public selectedCommentId;
  itemById(id) {
    return this.currentItems.find(el => el.id == id);
  }
  tableMappedItems(items) {
    return items.map((item: IDailyRoiItem, index) => ({
      ...item,
      rowId: item.id,
      id: item?.id,
      date: item.date,
      isActive: item?.isActive,
      consumablesComment: item?.consumablesComment,
      spent: item.spent,
      spentUSD: item.spentUSD,
      consumables: item.consumables,
      consumablesUSD: item.consumablesUSD,
      incomeRUB: item.incomeRUB,
      incomeUSD: item.incomeUSD,
      incomeEUR: item.incomeEUR,
      profit: item.profit,
      roi: item.roi,
      actions: false,
    }));
  }
  setDataTable() {
    this.dataTableConfig = {
      tableName: 'personalFinances',
      displayColumns: ['date', 'spent', 'consumables', 'incomeRUB', 'includingMonth', 'includingMinus', 'actions'],
      displayFooter: ['date', 'spent', 'consumables', 'incomeRUB', 'includingMonth', 'includingMinus', 'actions'],
      actions: new Map<DataTableActions, (...args) => any>([
        [
          DataTableActions.SELECT,
          selectedRowId => {
            if (!this.isActive) return;
            this.selectedItemId = selectedRowId;
            this.refundSelect(selectedRowId);
            this.cd.detectChanges();
          },
        ],
        [
          DataTableActions.CHANGE,
          el => {
            const updatedData = {
              ...el,
              rowId: undefined,
              actions: undefined,
            };
            const currentItemIndex = this.currentItems.findIndex(el => el.id === updatedData.id);
            if (currentItemIndex != -1) {
              this.currentItems[currentItemIndex] = {
                ...this.currentItems[currentItemIndex],
                ...updatedData,
              };
            }
            this.cd.detectChanges();
          },
        ],
      ]),
      filters: [
        {
          label: 'Период',
          direction: FilterTarget.BACK,
          control: {
            value: {
              // startDate: moment().startOf('month'),
              // endDate: moment(),

              startDate: this.filters?.startDate
                ? moment(this.filters.startDate, 'DD.MM.YYYY')
                : moment().startOf('month'),
              endDate: this.filters?.endDate ? moment(this.filters.endDate, 'DD.MM.YYYY') : moment(),
            },
            name: 'period',
            type: ControlType.DATE_PERIOD,
            valueType: ValueType.OBJECT,
          },
        },
      ],
      cells: [
        {
          matColumnDef: 'date',
          header: {
            label: 'Дата',
            classes: { 'w-150': true },
          },
          cell: {
            calculated: el => formatDate(el.date, 'mediumDate', 'ru'),
            classes: { 'w-150': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: 'Минус пред. периода/Неоплаченный траф',
                    styles: { borderLeft: '1px solid #d1d1d1', borderTop: '1px solid #d1d1d1' },
                  },
                  {
                    label: 'Итого',
                    styles: { borderLeft: '1px solid #d1d1d1' },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            styles: { color: '#e3b04e' },
            classes: { 'w-150': true },
          },
        },

        {
          matColumnDef: 'spent',
          header: {
            label: 'Потрачено',
            // content: {
            //   templateCalculated: () => this.cellContent.itemsContainer,
            //   contextCalculated: el => ({
            //     items: [
            //       // {
            //       //   label: '₽',
            //       //   styles: { display: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //       // {
            //       //   label: '$',
            //       //   styles: { borderTop: '1px solid #d1d1d1' },
            //       //   classes: { 'w-100': true },
            //       // },
            //     ],
            //   }),
            // },
            classes: { 'w-200': true },
            // styles: { display: 'none' },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.spentUSD, '$'),
                    classes: { 'w-100': true },
                    control: {
                      calculatedValue: el => el.spentUSD,
                      name: 'spentUSD',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                  },
                  // {
                  //   label: parseNumberWithPrefix(el.spentUSD, '$'),
                  //   control: {
                  //     calculatedValue: el => el.spentUSD,
                  //     name: 'spentUSD',
                  //     type: ControlType.INPUT,
                  //     valueType: ValueType.NUMBER,
                  //   },
                  //   classes: { 'w-100': true },
                  // },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            styles: { backgroundColor: '#f3dcdc' },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          // {
                          //   label: parseNumberWithPrefix(this.totalComissionTax, '₽'),
                          //   styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                          // },
                          {
                            label: parseNumberWithPrefix(this.negativeProfit, '$'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' }, //Минус пред периода
                            content: {
                              templateCalculated: () => {
                                return this.cellContent.commentElement;
                              },
                              contextCalculated: () => {
                                return {
                                  isSelected: this.selectedCommentId === 'comissionComment',
                                  isDisabled: !this.isActive,
                                  direction: 'top',
                                  key: 'comissionComment',
                                  name: 'comissionComment',
                                  termId: this.termId,
                                  isSaveExternal: false,
                                  comment: this.comissionComment || '',
                                  select: id => {
                                    this.selectedCommentId = id;
                                  },
                                  save: () => {
                                    console.log('save');
                                  },
                                };
                              },
                            },
                          },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          // {
                          //   label: parseNumberWithPrefix(this.totalSpent, '₽'),
                          //   styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          // },
                          {
                            label: parseNumberWithPrefix(this.totalSpentUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'consumables',
          header: {
            label: '',
            // styles: { display: '1px solid #d1d1d1' },
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: 'Комиссия',
                    // styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: 'Расходники',
                    // styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.commission, '$'),
                    control: {
                      calculatedValue: el => el.commission,
                      name: 'comission',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.consumablesUSD, '$'),
                    content: {
                      templateCalculated: () => {
                        return this.cellContent.commentElement;
                      },
                      contextCalculated: el => {
                        return {
                          isSelected: this.selectedCommentId === el?.id,
                          isDisabled: !this.isActive,
                          isHide: this.selectedItemId,
                          direction: 'top',
                          key: el?.id,
                          comment: el?.consumablesComment || '',
                          termId: el?.termId,
                          isSaveExternal: true,
                          select: id => {
                            this.selectedCommentId = id;
                          },
                          save: comment => {
                            const item = this.currentItems.find(it => it.id === el.id);
                            this.dataTableConfig.crudAPI.update({ ...item, consumablesComment: comment }).subscribe();
                          },
                        };
                      },
                    },
                    control: {
                      calculatedValue: el => el.consumablesUSD,
                      name: 'consumablesUSD',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            styles: { backgroundColor: '#f4e1e5' },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalConsumablesUSD, '$'), //Неоплаченный траф
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          },
                          // {
                          //   label: parseNumberWithPrefix(this.totalAccountTaxUSD, '$'),
                          //   content: {
                          //     templateCalculated: () => {
                          //       return this.cellContent.commentElement;
                          //     },
                          //     contextCalculated: () => {
                          //       return {
                          //         isSelected: this.selectedCommentId === 'accountComment',
                          //         isDisabled: !this.isActive,
                          //         direction: 'top',
                          //         key: 'accountComment',
                          //         name: 'accountComment',
                          //         termId: this.termId,
                          //         isSaveExternal: false,
                          //         comment: this.accountComment || '',
                          //         select: id => {
                          //           this.selectedCommentId = id;
                          //         },
                          //         save: () => {
                          //           console.log('save');
                          //         },
                          //       };
                          //     },
                          //   },
                          //   styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          // },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalComission, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalConsumablesUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'incomeRUB',
          header: {
            label: 'Доход',

            // content: {
            //   templateCalculated: () => this.cellContent.itemsContainer,
            //   contextCalculated: el => ({
            //     // items: [
            //     //   // {
            //     //   //   label: '₽',
            //     //   //   styles: { borderTop: '1px solid #d1d1d1' },
            //     //   //   classes: { 'w-100': true },
            //     //   // },
            //     //   // {
            //     //   //   label: '$',
            //     //   //   styles: { borderTop: '1px solid #d1d1d1' },
            //     //   //   classes: { 'w-100': true },
            //     //   // },
            //     //   // {
            //     //   //   label: '€',
            //     //   //   styles: { borderTop: '1px solid #d1d1d1' },
            //     //   //   classes: { 'w-100': true },
            //     //   // },
            //     // ],
            //   }),
            // },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  // {
                  //   label: parseNumberWithPrefix(el.incomeRUB, '₽'),
                  //   control: {
                  //     calculatedValue: el => el.incomeRUB,
                  //     name: 'incomeRUB',
                  //     type: ControlType.INPUT,
                  //     valueType: ValueType.NUMBER,
                  //   },
                  //   classes: { 'w-100': true },
                  // },
                  {
                    label: parseNumberWithPrefix(el.incomeUSD, '$'),
                    control: {
                      calculatedValue: el => el.incomeUSD,
                      name: 'incomeUSD',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                  // {
                  //   label: parseNumberWithPrefix(el.incomeEUR, '€'),
                  //   control: {
                  //     calculatedValue: el => el.incomeEUR,
                  //     name: 'incomeEUR',
                  //     type: ControlType.INPUT,
                  //     valueType: ValueType.NUMBER,
                  //   },
                  //   classes: { 'w-100': true },
                  // },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          // {
                          //   calculated: () => parseNumberWithPrefix(this.totalIncome, '₽'),
                          //   styles: { borderBottom: 'none' },
                          // },
                          {
                            calculated: () => parseNumberWithPrefix(this.totalIncomeUSD, '$'),
                            styles: { borderBottom: 'none' },
                          },
                          // {
                          //   calculated: () => parseNumberWithPrefix(this.totalIncomeEUR, '€'),
                          //   styles: { borderBottom: 'none' },
                          // },
                        ],
                      }),
                    },
                    styles: {
                      // borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },

        {
          matColumnDef: 'includingMonth',
          header: {
            label: 'Внутри месяца',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: 'Профит',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: 'ROI',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.profit, '$'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#d5ebd5' },
                  },
                  {
                    label: parseNumberWithPrefix(el.roi, '%'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#dedede' },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfit, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalRoi, '%'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      // borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },

        {
          matColumnDef: 'includingMinus',
          header: {
            label: 'C учетом Минуса',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: 'Профит',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: 'ROI',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.profitMinus, '$'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#d5ebd5' },
                  },
                  {
                    label: parseNumberWithPrefix(el.roiMinus, '%'),
                    classes: { 'w-100': true },
                    styles: { backgroundColor: '#dedede' },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfitMinus, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalRoiMinus, '%'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      // borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'w-50': true },
          },
          cell: {
            content: {
              templateCalculated: el => this.selectedItemId === el.rowId && this.cellContent.actionsElement,
              contextCalculated: el =>
                this.selectedItemId === el.rowId && {
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

                    const item = this.currentItems.find(it => it.id === el.id);

                    const updatedData = {
                      ...item,
                      ...changes,
                      profit: this.financesService.getProfit(this.itemById(el.id)),
                      roi: this.financesService.getRoi(this.currentItems, this.itemById(el.id)),
                      rowId: undefined,
                      actions: undefined,
                    };

                    this.dataTableConfig.crudAPI.update(updatedData).subscribe();
                  },
                  close: () => {
                    this.dataTableInstance.resetControlValue(el.id);
                    this.selectedItemId = null;
                    this.cd.detectChanges();
                  },
                },
            },
            classes: { 'hide-border': true, 'w-50': true },
          },
          footer: {
            styles: { display: 'none' },
            classes: { 'w-50': true },
          },
        },
      ],
      crudAPI: {
        list: ({
          // startDate = moment().startOf('month').format('DD.MM.YYYY'),
          // endDate = moment().format('DD.MM.YYYY'),
          startDate = (this.filters?.startDate
            ? moment(this.filters.startDate, 'DD.MM.YYYY')
            : moment().startOf('month')
          ).format('DD.MM.YYYY'),
          endDate = (this.filters?.endDate ? moment(this.filters.endDate, 'DD.MM.YYYY') : moment()).format(
            'DD.MM.YYYY'
          ),
        }) => {
          return combineLatest(
            this.loadBudgets(startDate),
            this.financesService.getDailyRoies(this.paramsId, startDate, endDate)
          ).pipe(
            map(([budget, finances]) => finances),
            map(response => {
              this.updateDailyROI(response);
              this.filterProfit();
              this.editingAccounts = false;
              this.editingComission = false;
              this.refundSelect();
              return this.currentItems;
            }),
            map(items => this.tableMappedItems(items))
          );
        },
        listSide: () => {
          this.filterProfit();
          return this.tableMappedItems(this.currentItems);
        },
        update: item => {
          return this.financesService.updateRow(item).pipe(
            tap(resp => {
              this.selectedItemId = null;
              this.dataTableInstance.updListSync(resp);
            })
          );
        },
      },
      rowConfig: {
        header: {
          sticky: true,
        },
        footer: {
          sticky: true,
          styles: { marginTop: '50px' },
        },
      },
    };
  }

  setDataTableOld() {
    this.dataTableConfig = {
      tableName: 'personalFinances',
      displayColumns: ['date', 'spent', 'consumables', 'incomeRUB', 'profit', 'roi', 'usdRub', 'actions'],
      displayFooter: ['date', 'spent', 'consumables', 'incomeRUB', 'profit', 'roi', 'usdRub', 'actions'],
      actions: new Map<DataTableActions, (...args) => any>([
        [
          DataTableActions.SELECT,
          selectedRowId => {
            if (!this.isActive) return;
            this.selectedItemId = selectedRowId;
            this.refundSelect(selectedRowId);
            this.cd.detectChanges();
          },
        ],
        [
          DataTableActions.CHANGE,
          el => {
            const updatedData = {
              ...el,
              rowId: undefined,
              actions: undefined,
            };
            const currentItemIndex = this.currentItems.findIndex(el => el.id === updatedData.id);
            if (currentItemIndex != -1) {
              this.currentItems[currentItemIndex] = {
                ...this.currentItems[currentItemIndex],
                ...updatedData,
              };
            }
            this.cd.detectChanges();
          },
        ],
      ]),
      filters: [
        {
          label: 'Период',
          direction: FilterTarget.BACK,
          control: {
            value: {
              startDate: this.filters?.startDate
                ? moment(this.filters.startDate, 'DD.MM.YYYY')
                : moment().startOf('month'),
              endDate: this.filters?.endDate ? moment(this.filters.endDate, 'DD.MM.YYYY') : moment(),
            },
            name: 'period',
            type: ControlType.DATE_PERIOD,
            valueType: ValueType.OBJECT,
          },
        },
      ],
      cells: [
        {
          matColumnDef: 'date',
          header: {
            label: 'Дата',
            classes: { 'w-150': true },
          },
          cell: {
            calculated: el => formatDate(el.date, 'mediumDate', 'ru'),
            classes: { 'w-150': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: 'Комиссия/Расходники*',
                  },
                  {
                    label: 'Итого',
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            styles: { color: '#e3b04e' },
            classes: { 'w-150': true },
          },
        },

        {
          matColumnDef: 'spent',
          header: {
            label: 'Потрачено',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: '₽',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '$',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.spent, '₽'),
                    classes: { 'w-100': true },
                    control: {
                      calculatedValue: el => el.spent,
                      name: 'spent',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                  },
                  {
                    label: parseNumberWithPrefix(el.spentUSD, '$'),
                    control: {
                      calculatedValue: el => el.spentUSD,
                      name: 'spentUSD',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            styles: { backgroundColor: '#f3dcdc' },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalComissionTax, '₽'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalComissionTaxUSD, '$'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f3dcdc' },
                            content: {
                              templateCalculated: () => {
                                return this.cellContent.commentElement;
                              },
                              contextCalculated: () => {
                                return {
                                  isSelected: this.selectedCommentId === 'comissionComment',
                                  isDisabled: !this.isActive,
                                  direction: 'top',
                                  key: 'comissionComment',
                                  name: 'comissionComment',
                                  termId: this.termId,
                                  isSaveExternal: false,
                                  comment: this.comissionComment || '',
                                  select: id => {
                                    this.selectedCommentId = id;
                                  },
                                  save: () => {
                                    console.log('save');
                                  },
                                };
                              },
                            },
                          },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalSpent, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalSpentUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f3dcdc' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'consumables',
          header: {
            label: 'Расходники',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: '₽',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '$',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-200': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.consumables, '₽'),
                    control: {
                      calculatedValue: el => el.consumables,
                      name: 'consumables',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.consumablesUSD, '$'),
                    content: {
                      templateCalculated: () => {
                        return this.cellContent.commentElement;
                      },
                      contextCalculated: el => {
                        return {
                          isSelected: this.selectedCommentId === el?.id,
                          isDisabled: !this.isActive,
                          isHide: this.selectedItemId,
                          direction: 'top',
                          key: el?.id,
                          comment: el?.consumablesComment || '',
                          termId: el?.termId,
                          isSaveExternal: true,
                          select: id => {
                            this.selectedCommentId = id;
                          },
                          save: comment => {
                            const item = this.currentItems.find(it => it.id === el.id);
                            this.dataTableConfig.crudAPI.update({ ...item, consumablesComment: comment }).subscribe();
                          },
                        };
                      },
                    },
                    control: {
                      calculatedValue: el => el.consumablesUSD,
                      name: 'consumablesUSD',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            styles: { backgroundColor: '#f4e1e5' },
            classes: { 'w-200': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalAccountTax, '₽'),
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalAccountTaxUSD, '$'),
                            content: {
                              templateCalculated: () => {
                                return this.cellContent.commentElement;
                              },
                              contextCalculated: () => {
                                return {
                                  isSelected: this.selectedCommentId === 'accountComment',
                                  isDisabled: !this.isActive,
                                  direction: 'top',
                                  key: 'accountComment',
                                  name: 'accountComment',
                                  termId: this.termId,
                                  isSaveExternal: false,
                                  comment: this.accountComment || '',
                                  select: id => {
                                    this.selectedCommentId = id;
                                  },
                                  save: () => {
                                    console.log('save');
                                  },
                                };
                              },
                            },
                            styles: { borderBottom: '1px solid #d1d1d1', backgroundColor: '#f4e1e5' },
                          },
                        ],
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: parseNumberWithPrefix(this.totalConsumables, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                          {
                            label: parseNumberWithPrefix(this.totalConsumablesUSD, '$'),
                            styles: { borderBottom: 'none', backgroundColor: '#f4e1e5' },
                          },
                        ],
                      }),
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
              }),
            },
            classes: { 'w-200': true },
          },
        },
        {
          matColumnDef: 'incomeRUB',
          header: {
            label: 'Доход',
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    label: '₽',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '$',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                  {
                    label: '€',
                    styles: { borderTop: '1px solid #d1d1d1' },
                    classes: { 'w-100': true },
                  },
                ],
              }),
            },
            classes: { 'w-300': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.incomeRUB, '₽'),
                    control: {
                      calculatedValue: el => el.incomeRUB,
                      name: 'incomeRUB',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.incomeUSD, '$'),
                    control: {
                      calculatedValue: el => el.incomeUSD,
                      name: 'incomeUSD',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                  {
                    label: parseNumberWithPrefix(el.incomeEUR, '€'),
                    control: {
                      calculatedValue: el => el.incomeEUR,
                      name: 'incomeEUR',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId,
              }),
            },
            classes: { 'w-300': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.totalIncome, '₽'),
                            styles: { borderBottom: 'none' },
                          },
                          {
                            calculated: () => parseNumberWithPrefix(this.totalIncomeUSD, '$'),
                            styles: { borderBottom: 'none' },
                          },
                          {
                            calculated: () => parseNumberWithPrefix(this.totalIncomeEUR, '€'),
                            styles: { borderBottom: 'none' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                },
              }),
            },
            classes: { 'w-300': true },
          },
        },

        {
          matColumnDef: 'profit',
          header: {
            label: 'Профит',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: el => parseNumberWithPrefix(el.profit, '₽'),
            styles: { backgroundColor: '#d5ebd5' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalProfitOld, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#d5ebd5' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'roi',
          header: {
            label: 'ROI',
            classes: { 'w-100': true },
          },
          cell: {
            calculated: (el, elements) => parseNumberWithPrefix(el.roi, '%'),
            styles: { backgroundColor: '#dedede' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.getTotalRoiOld, '%'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'usdRub',
          header: {
            label: 'USD_RUB курс $',
            classes: { 'w-100': true },
          },
          cell: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: (el, elements) => ({
                items: [
                  {
                    label: parseNumberWithPrefix(el.usdRub, '₽'),
                    control: {
                      calculatedValue: el => el.usdRub,
                      name: 'usdRub',
                      type: ControlType.INPUT,
                      valueType: ValueType.NUMBER,
                    },
                    classes: { 'w-100': true },
                  },
                ],
                element: el,
                elements: elements,
                showControl: this.selectedItemId === el?.rowId && this.canEditUsdRub(),
              }),
            },
            styles: { backgroundColor: '#dedede' },
            classes: { 'w-100': true },
          },
          footer: {
            content: {
              templateCalculated: () => this.cellContent.itemsContainer,
              contextCalculated: el => ({
                items: [
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            label: '',
                            styles: { border: 'none' },
                          },
                        ],
                        styles: { border: 'none' },
                      }),
                    },
                  },
                  {
                    content: {
                      templateCalculated: () => this.cellContent.itemsContainer,
                      contextCalculated: el => ({
                        items: [
                          {
                            calculated: () => parseNumberWithPrefix(this.avrUsdRub, '₽'),
                            styles: { borderBottom: 'none', backgroundColor: '#dedede' },
                          },
                        ],
                      }),
                    },
                    styles: {
                      borderRight: '1px solid #d1d1d1',
                    },
                  },
                ],
                classes: {
                  'column-direction': true,
                },
                styles: {
                  borderTop: 'none',
                  borderRight: 'none',
                  borderLeft: 'none',
                },
              }),
            },
            styles: {
              borderRight: 'none',
              borderLeft: 'none',
            },
            classes: { 'w-100': true },
          },
        },
        {
          matColumnDef: 'actions',
          header: {
            classes: { 'hide-border': true, 'w-50': true },
          },
          cell: {
            content: {
              templateCalculated: el => this.selectedItemId === el.rowId && this.cellContent.actionsElement,
              contextCalculated: el =>
                this.selectedItemId === el.rowId && {
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

                    const item = this.currentItems.find(it => it.id === el.id);

                    const updatedData = {
                      ...item,
                      ...changes,
                      profit: this.financesService.getProfit(this.itemById(el.id)),
                      roi: this.financesService.getRoi(this.currentItems, this.itemById(el.id)),
                      rowId: undefined,
                      actions: undefined,
                    };

                    this.dataTableConfig.crudAPI.update(updatedData).subscribe();
                  },
                  close: () => {
                    this.dataTableInstance.resetControlValue(el.id);
                    this.selectedItemId = null;
                    this.cd.detectChanges();
                  },
                },
            },
            classes: { 'hide-border': true, 'w-50': true },
          },
          footer: {
            styles: { display: 'none' },
            classes: { 'w-50': true },
          },
        },
      ],
      crudAPI: {
        list: ({
          // startDate = moment().startOf('month').format('DD.MM.YYYY'),
          // endDate = moment().format('DD.MM.YYYY'),

          startDate = (this.filters?.startDate
            ? moment(this.filters.startDate, 'DD.MM.YYYY')
            : moment().startOf('month')
          ).format('DD.MM.YYYY'),
          endDate = (this.filters?.endDate ? moment(this.filters.endDate, 'DD.MM.YYYY') : moment()).format(
            'DD.MM.YYYY'
          ),
        }) => {
          return combineLatest(
            this.loadBudgets(startDate),
            this.financesService.getDailyRoies(this.paramsId, startDate, endDate)
          ).pipe(
            map(([budget, finances]) => finances),
            map(response => {
              this.updateDailyROI(response);
              this.filterProfit();
              this.editingAccounts = false;
              this.editingComission = false;
              this.refundSelect();
              return this.currentItems;
            }),
            map(items => this.tableMappedItems(items))
          );
        },
        listSide: () => {
          this.filterProfit();
          return this.tableMappedItems(this.currentItems);
        },
        update: item => {
          return this.financesService.updateRow(item).pipe(
            tap(resp => {
              this.selectedItemId = null;
              this.dataTableInstance.updListSync(resp);
            })
          );
        },
      },
      rowConfig: {
        header: {
          sticky: true,
        },
        footer: {
          sticky: true,
          styles: { marginTop: '50px' },
        },
      },
    };
  }
  get currentMonth() {
    return this.monthNames[new Date(this.campaignOne?.value?.start).getMonth()] || '';
  }
}
