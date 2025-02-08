import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MotivationChart } from './motivations-grid.service';
import { PercentItem } from './percents-grid.service';
import { AppSettings } from './settings';

export interface ITopData {
  teamTopStatistics: ITeamTopStatisticsItem[];
  userTopStatistics: IUserTopStatistics[];
}

export interface ITeamTopStatisticsItem {
  teamId: number;
  profit: number;
}

export interface IUserTopStatistics {
  username: string;
  profit: number;
}

export interface IUserInfo {
  birthday: string;
  extendedContactInformation: string;
  firstName: string;
  id: number;
  email: string;
  lastName: string;
  patronymic: string;
  paymentInfo: IPaymentItem[];
  phoneNumber: string;
  profitPercent: number;
  teamId: number;
  userName: string;
  roleId: number;
  userRoles: IUserRoles[];
  percentChart: PercentItem;
  vkontakte: string;
  instagram: string;
  telegram: string;
  imageUrl: string;
  isActive?: boolean;
  isRemote?: boolean;
}

interface IPaymentItem {
  paymentInfoType: string;
  value: string;
}

export interface IPaymentInfoType {
  paymentInfoType: string;
  name: string;
}

interface IUserRoles {
  role: string;
  roleId: string;
  userId: string;
}

interface IUnitStatistic {
  profit: number;
  teamId?: number;
  unitId?: number;
}

export interface IStatistic {
  customInternshipPercent: number;
  customLeadPercent: {
    percentFromBuyer: number;
    percentFromSmart: number;
    percentFromHelper: number;
  };
  percentOfAgencyClearProfit: number;
  clearProfit: number;
  clearProfitForLastMonth: number;
  clearProfitForMonth: number;
  isPayedTermClosed: boolean;
  isWorkingCapitalTermClosed: boolean;
  profitForLastMonth: number;
  profitForMonth: number;
  profitForYesterday: number;
  unitStatistic: IUnitStatistic[];
  percentChart: PercentItem;
  percentChartLastMonth: PercentItem;
  prepaidExpense: number;
}

export interface IHelperStatistic {
  quantityForMonth: number;
  quantityForLastMonth: number;
  salaryForMonth: number;
  salaryForLastMonth: number;
  motivationChart: MotivationChart;
  motivationChartLastMonth: MotivationChart;
  fixedSalary: number;
}

interface IRecountParams {
  startDate: string;
  finishDate: string;
}

@Injectable({ providedIn: 'root' })
export class UserInfoService {
  userFullName: string;

  percentColorsBaer = {
    0: '#E51A1A',
    1: '#E3B04E',
    2: '#DFD829',
    3: '#51A34F',
  };

  percentColorsSmart = {
    15: '#E51A1A',
    20: '#51A34F',
  };

  paymentInfoTypes = [
    {
      name: 'Qiwi',
      paymentInfoType: '1',
      currency: 1,
    },
    {
      name: 'Webmoney',
      paymentInfoType: '2',
      currency: 3,
    },
    {
      name: 'Банковская карта(₽)',
      paymentInfoType: '3',
      currency: 1,
    },
    {
      name: 'Наличные(₽)',
      paymentInfoType: '4',
      currency: 1,
    },
    {
      name: 'Банковская карта($)',
      paymentInfoType: '5',
      currency: 3,
    },
    {
      name: 'Наличные($)',
      paymentInfoType: '6',
      currency: 3,
    },
  ];

  public currency = {
    1: '₽',
    2: '€',
    3: '$',
  };

  userInfo;

  _date: any = moment().format('dd.MM.yyyy');

  set date(date: any) {
    this._date = date;
  }

  get date() {
    return this._date;
  }

  constructor(private http: HttpClient) {}

  getAllUsers(ids: number[] = [], onlyActive: boolean = false, teamId?): Observable<IUserInfo[]> {
    let params: any = { onlyActive: '' + onlyActive };
    if (teamId) {
      params = {
        ...params,
        teamId,
      };
    }
    return this.http.post<IUserInfo[]>(`${AppSettings.API_IDENTITY_ENDPOINT}/identity/users/all`, ids, { params });
  }

  getUsersGrouped(): Observable<any[]> {
    return this.http.post<any[]>(`${AppSettings.API_IDENTITY_ENDPOINT}/identity/users/grouped?onlyActive=true`, []);
  }

  getUserInfo(id: string): Observable<IUserInfo> {
    return this.http
      .get<IUserInfo>(`${AppSettings.API_IDENTITY_ENDPOINT}/identity/users/${id}`)
      .pipe(tap(d => (this.userInfo = d)));
  }

  updateUserInfo(id: string, body: any): Observable<IUserInfo> {
    return this.http.put<IUserInfo>(`${AppSettings.API_IDENTITY_ENDPOINT}/identity/users/${id}`, body);
  }

  public updateUserPaymentInfo(id: string, item: IPaymentItem): Observable<IUserInfo> {
    return this.http.post<IUserInfo>(`${AppSettings.API_IDENTITY_ENDPOINT}/Identity/users/${id}/paymentInfo`, item);
  }

  public deletePaymentInfoItem(userId: number, paymentId: string): Observable<IPaymentItem> {
    return this.http.delete<IPaymentItem>(
      `${AppSettings.API_IDENTITY_ENDPOINT}/Identity/users/${userId}/paymentInfo/${paymentId}`
    );
  }

  public getStatisticAdminTeamLead(id: string, date?): Observable<IStatistic> {
    return this.http.get<IStatistic>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/user/${id}/statistic`, {
      params: { date },
    });
  }

  public getStatisticTeamLeadPromotion(id: string, date?): Observable<IStatistic> {
    return this.http.get<IStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/teamLeadPromotion/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticTeamLeadTechnicalSpecialist(id: string, date?): Observable<IStatistic> {
    return this.http.get<IStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/teamLeadTechnicalSpecialist/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticHelper(id: string, date?): Observable<IHelperStatistic> {
    return this.http.get<IHelperStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/helper/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticCreative(id: string, date?): Observable<IHelperStatistic> {
    return this.http.get<IHelperStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/creative/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticTechSpecialist(id: string, date?): Observable<IHelperStatistic> {
    return this.http.get<IHelperStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/techSpecialist/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticFarmer(id: string, date?): Observable<IHelperStatistic> {
    return this.http.get<IHelperStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/farmer/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticTeamLeadFarmer(id: string, date?): Observable<IHelperStatistic> {
    return this.http.get<IHelperStatistic>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/teamLeadFarmer/${id}/statistic`,
      {
        params: { date },
      }
    );
  }

  public getStatisticOther(id: string, date?): Observable<IStatistic> {
    return this.http.get<IStatistic>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/buyer/${id}/statistic`, {
      params: { date },
    });
  }

  public changeSalaryByUserIdAndDate(userId: string, date: string, value: number) {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/changeSalaryByUserIdAndDate`,
      value,
      {
        params: { userId, date },
      }
    );
  }

  public changePrepaidExpenseByUserIdAndDate(userId: string, date: string, prepaidExpense: number) {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/prepaidExpense/byUserId/${userId}`,
      undefined,
      {
        params: { prepaidExpense: String(prepaidExpense), date },
      }
    );
  }

  public changeAgencyProfitPercentByUserIdAndDate(userId: string, date: string, agencyProfitPercent: number) {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/agencyProfitPercent/byUser/${userId}`,
      undefined,
      {
        params: { date, agencyProfitPercent: String(agencyProfitPercent) },
      }
    );
  }

  public loadImage(id: string, img: FormData): Observable<string> {
    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/Identity/users/${id}/uploadImage/Avatar`, img, {
      responseType: 'text',
    });
  }

  public saveReconciliationReport(date: string) {
    // @ts-ignore
    return this.http.get<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/ReconciliationReport?date=${date}`,
      { responseType: 'blob' as 'json' }
    );
  }

  public saveSalaryReport(date: string) {
    // @ts-ignore
    return this.http.get<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/statistic?date=${date}`, {
      responseType: 'blob' as 'json',
    });
  }

  uploadImage(file: File): Observable<string> {
    const uploadData = new FormData();
    uploadData.append('reqFile', file);

    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/Identity/uploadImage`, uploadData, {
      responseType: 'text',
    });
  }

  public closeOS(): Observable<any> {
    return this.http.post<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkingCapital/closeLastMonth`, {});
  }

  public closeDailyRoi(date: IRecountParams): Observable<any> {
    // return this.http.post<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/closePreviousMonth`, {});
    const params = { ...date };
    return this.http.post<IRecountParams>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/closePreviousMonth`, {
      params,
    });
  }

  public updateInternshipDays(id: number, days: number): Observable<any> {
    return this.http.put<any>(`${AppSettings.API_IDENTITY_ENDPOINT}/identity/users/${id}/internship?days=${days}`, {});
  }

  public setPercentChart(id: number, date, percentChartId: number): Observable<any> {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/percentCharts/users/${id}/setPercentChart?percentChartId=${percentChartId}&date=${date}`,
      {}
    );
  }

  public getRoleByUserAndDate(userId: string, date: string): Observable<number> {
    return this.http.get<number>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/getRoleByUserAndDate`, {
      params: { userId, date },
    });
  }

  public getTopInfo(date: string): Observable<ITopData> {
    return this.http.get<ITopData>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/DailyRoi/top-profit-statistic`, {
      params: { date },
    });
  }
}
