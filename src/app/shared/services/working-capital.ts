import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppSettings } from './settings';

@Injectable({ providedIn: 'root' })
export class WorkingCapitalService {
  public selectedDate = new BehaviorSubject(null);

  constructor(private http: HttpClient) {}

  public getWorkingCapitalData(userId, date): Observable<IWorkingCapital> {
    return this.http.get<IWorkingCapital>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/personal/byMonthAndUserId`,
      { params: { userId, date } }
    );
  }

  public getCommonWorkingCapitalMonthForTeamlead(date): Observable<ICommonWorkingCapitalTeamLead> {
    return this.http.get<ICommonWorkingCapitalTeamLead>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/common/byMonthForTeamlead`,
      { params: { date } }
    );
  }

  public getCommonWorkingCapitalData(date): Observable<ICommonWorkingCapital[]> {
    return this.http.get<ICommonWorkingCapital[]>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/common/byMonth`,
      { params: { date } }
    );
  }

  public updateRow(paymentsArray: any, isUnhandledRequestApprove: boolean = false): Observable<any> {
    let params: any = { isUnhandledRequestApprove: '' + isUnhandledRequestApprove };
    return this.http.put<IWorkingCapital>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/paymentInfoDaily/range`,
      paymentsArray,
      {
        params,
      }
    );
  }

  public createMoneyRequest(request: any): Observable<any> {
    return this.http.post<IWorkingCapital>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/unhandledMoneyRequest`,
      request
    );
  }

  public deleteMoneyRequest(id: number): Observable<any> {
    return this.http.delete<IWorkingCapital>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/unhandledMoneyRequest/${id}`
    );
  }

  public saveRemains(item: IRemains, termId: number): Observable<any> {
    return this.http.put<IRemains>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/terms/${termId}/Remains`,
      item
    );
  }

  public saveCommandRemains(item: IRemains, termId: number): Observable<any> {
    return this.http.put<IRemains>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/terms/${termId}/commandRemains`,
      item
    );
  }
}

export interface IPaymentInfoDailyGroupsItem {
  currency: number;
  date: string;
  id: number;
  name: string;
  paymentInfoId: number;
  paymentInfoType: number;
  value: number;
  workingCapitalTermId: number;
}

export interface IWorkingCapital {
  isActive: boolean;
  factRemains: {
    usd: number;
    rub: number;
  };
  needRemains: {
    usd: number;
    rub: number;
  };
  paymentInfoDailyGroups: IPaymentInfoDailyGroups[];
  paymentInfoTypes: number[];
  termId: number;
  unhandledMoneyRequests: any[];
}

export interface IMoneyRequest {
  id: number;
  workingCapitalTermId: number;
  moneyRemains: number;
  moneyNeed: number;
  paymentInfoType: number;
  paymentInfoName: string;
}

export interface IRemains {
  remainsFact: IRemainsItem;
  remainsNeed: IRemainsItem;
}

interface IRemainsItem {
  usd: number;
  rub: number;
}

export interface ICommonWorkingCapitalTeamLead {
  commandRemainsFact: IRemainsItem;
  commandRemainsNeed: IRemainsItem;
  workingCapitalCommonResponses: ICommonWorkingCapital[];
  termId: number;
}

export interface ICommonWorkingCapital {
  comission: number;
  paymentInfoDailiesMerged: IPaymentInfoDailiesMerged[];
  roleId: number;
  teamId: number;
  unhandledMoneyRequestCount: number;
  userId: number;
  username: string;
  termId?: number;
}

export interface IPaymentInfoDailiesMerged {
  currency?: number;
  paymentInfoType: number;
  value: number;
}

type IPaymentInfoDailyGroups = IPaymentInfoDailyGroupsItem[];
