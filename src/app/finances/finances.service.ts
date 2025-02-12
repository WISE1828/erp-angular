import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject, Observable } from 'rxjs';
import { oldTableBeforeDate } from '../shared/constants';
import {
  checkNumber,
  consumableInRub,
  consumableInUSD,
  incomeInRub,
  incomeInUSD,
  spentInRub,
  spentInUSD,
} from '../shared/math/formulas.base';
import { AppSettings } from '../shared/services/settings';

export interface ICommonFinanceItem {
  dailyRoiGroupStatisticDtos: ICommonDailyRoiItem[];
  totalRoi: number;
}

export interface ICommonDailyRoiItem {
  comissionTax: number;
  comissionTaxUsd: number;
  accountTax: number;
  accountTaxUsd: number;
  minusPreviousPeriod: number;
  profitPercent: number;
  userId: number;
  userName: string;
  userRoleId: number;
  teamId: number;
  isActive: boolean;
  meta: {
    spentUSD: number;
    clearProfit: number;
    spent: number;
    consumables: number;
    consumablesUSD: number;
    incomeRUB: number;
    incomeUSD: number;
    incomeEUR: number;
    profit: number;
    profitWithComission?: number;
    roi: number;
    usdRub: number;
    eurRub: number;
    profitMinus: number;
    roiMinus: number;
    negativeProfit: number;
    slices: number;
    commission: number;
  };
}

export interface IDailyRoiItem {
  eurRub: number;
  consumables: number;
  consumablesUSD: number;
  date: string;
  id: number;
  incomeRUB: number;
  incomeUSD: number;
  incomeEUR: number;
  isActive: boolean;
  isInternship: boolean;
  profit: number;
  profitPercent: number;
  roi: number;
  spent: number;
  spentUSD: number;
  termId: number;
  changed?: boolean;
  usdRub: number;
  comissionTax?: number;
  comissionTaxUsd?: number;
  commission: number;
  accountsTax?: number;
  accountsTaxUsd?: number;
  dailyRoiTermCount?: number;
  consumablesComment?: string;
  profitMinus: number;
  roiMonth: number;
}

export interface IDailyRoiData {
  dailyRoiDtos: IDailyRoiItem[];
  dailyRoiTermCount: number;
  termId: number;
  prepaidExpense: number;
  profitPercent: number;
  termTax: {
    comissionTax: number;
    comissionTaxUsd: number;
    comission: number;
    accountsTax: number;
    accountsTaxUsd: number;
    accountComment: string;
    comissionComment: string;
    slices: number;
  };
  refunds: IRefunds[];
  isActive?: boolean;
  negativeProfit: number;
}

export interface ITermTax {
  comissionTax: number;
  comissionTaxUsd: number;
  accountsTax: number;
  slices: number;
}

export interface IComment {
  AccountComment?: string;
  ComissionComment?: string;
}

export interface IRefunds {
  refundRUB: number;
  refundUSD: number;
  refundEUR: number;
  date: string;
}

interface IRecountParams {
  startDate: string;
  finishDate: string;
}

@Injectable()
export class FinancesService {
  public selectedId = new BehaviorSubject(null);
  public selectedConsumablesCommentId = null;

  constructor(private http: HttpClient) {}

  // TODO: рудимент для работы компонентов редактирования - удалить после рефакторинга таблиц

  public getRoi(list: IDailyRoiItem[], item: IDailyRoiItem, startDate: moment.Moment): number {
    const income = this.getProfit(item, startDate);
    const spent = spentInRub(item);
    const consumables = consumableInRub(item);
    const expose = spent + consumables;

    return checkNumber((income / expose) * 100, 0);
  }

  public getRoiMinus(item: IDailyRoiItem, data: IDailyRoiData[], startDate: moment.Moment): number {
    const income = this.getProfit(item, startDate);
    const spent = spentInRub(item);
    const consumables = consumableInRub(item);
    const expose = spent + consumables;
    const negativeProfit = data[0].negativeProfit;
    const daysInMonth = startDate.daysInMonth();

    if (data[0].negativeProfit === 0) {
      return checkNumber((income / expose) * 100, 0);
    } else {
      return checkNumber(((income - negativeProfit / daysInMonth) / expose) * 100, 0);
    }
  }

  public getProfit(item: IDailyRoiItem, startDate: moment.Moment): number {
    if (item.usdRub === 0) {
      item.usdRub = 1;
    }
    const income = incomeInRub(item);
    const spent = spentInRub(item);
    const consumables = consumableInRub(item);
    const expose = spent + consumables;
    const commission = item.commission;

    const incomeUSD = incomeInUSD(item);
    const spentUSD = spentInUSD(item);
    const consumablesUSD = consumableInUSD(item);
    const exposeUSD = spentUSD + consumablesUSD;

    if (startDate.isBefore(oldTableBeforeDate)) {
      return checkNumber(income - expose, 0);
    } else {
      return checkNumber(incomeUSD - exposeUSD - commission, 0);
    }
    // return checkNumber(income - expose, 0);
    // return checkNumber(income - expose - commission, 0);
  }

  // public getProfit(item: IDailyRoiItem): number {
  //   if (item.usdRub === 0) {
  //     item.usdRub = 1;
  //   }
  //   const income = incomeInRub(item);
  //   const spent = spentInRub(item);
  //   const consumables = consumableInRub(item);
  //   const expose = spent + consumables;
  //   const commission = item.commission;

  //   const incomeUSD = incomeInUSD(item);
  //   const spentUSD = spentInUSD(item);
  //   const consumablesUSD = consumableInUSD(item);
  //   const exposeUSD = spentUSD + consumablesUSD;

  //   const startDate: moment.Moment = moment();

  //   if (startDate.isBefore(oldTableBeforeDate)) {
  //     return checkNumber(income - expose, 0);
  //   } else {
  //     return checkNumber(incomeUSD - exposeUSD - commission, 0);
  //   }
  //   // return checkNumber(income - expose, 0);
  //   // return checkNumber(income - expose - commission, 0);
  // }

  public getProfitMinus(
    item: IDailyRoiItem,
    data: IDailyRoiData[],
    startDate: moment.Moment,
    endDate: moment.Moment
  ): number {
    const incomeUSD = incomeInUSD(item);
    const spentUSD = spentInUSD(item);
    const consumablesUSD = consumableInUSD(item);
    const exposeUSD = spentUSD + consumablesUSD;
    const commission = item.commission;
    const negativeProfit = data[0].negativeProfit;
    const daysInMonth = startDate.daysInMonth();
    const profitMinus = incomeUSD - exposeUSD - commission - negativeProfit / daysInMonth;

    if (negativeProfit === 0) {
      return checkNumber(incomeUSD - exposeUSD - commission, 0);
    } else {
      return checkNumber(profitMinus, 0);
    }
  }

  // http

  public getDailyRoies(userId: string, startDate: string, finishDate: string): Observable<IDailyRoiData[]> {
    return this.http.get<IDailyRoiData[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/by-userId`, {
      params: { userId, startDate, finishDate },
    });
  }

  public getCommonDailyRoies(startDate: string, finishDate: string): Observable<ICommonFinanceItem> {
    return this.http.get<ICommonFinanceItem>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/groups`, {
      params: { startDate, finishDate },
    });
  }

  public updateRow(item: IDailyRoiItem): Observable<any> {
    return this.http.put<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/${item.id}`, item);
  }

  public updateTax(termId: number, termTax: ITermTax): Observable<any> {
    return this.http.put<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/${termId}/tax`, termTax);
  }

  public updateComments(comments: IComment, termId: number): Observable<any> {
    return this.http.put<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/${termId}/tax/comments`, comments);
  }

  public getTaxAndComments(termId: number): Observable<any> {
    return this.http.get<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/${termId}/tax`);
  }

  public updatePrepaidExpenseId(prepaidExpenseId: number, prepaidExpense: number): Observable<any> {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/${prepaidExpenseId}/prepaidExpense`,
      prepaidExpense
    );
  }

  public updateRefunds(userId: number, refunds: IRefunds, date) {
    return this.http.put<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/${userId}/refund`, {
      ...refunds,
      date,
    });
  }

  public recountRoi(date: IRecountParams): Observable<any> {
    const params = { ...date };
    return this.http.post<IRecountParams>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/currency/synchronize`,
      undefined,
      { params }
    );
  }
}
