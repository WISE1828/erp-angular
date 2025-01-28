import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from './settings';
import * as moment from 'moment';
import { formatDate } from '@angular/common';

export interface ProfitPercentInfo {
  percent: number;
  profit: number;
}
export interface PercentItem {
  id?: number;
  name: string;
  date?: string;
  profitPercentInfoCollection: ProfitPercentInfo[];
}

export interface PercentLead {
  percentFromBuyer: number;
  percentFromSmart: number;
  percentFromHelper: number;
}

@Injectable({
  providedIn: 'root',
})
export class PercentsGridService {
  filterDate = moment().startOf('month').toDate();

  constructor(private http: HttpClient) {}

  get formatedDate() {
    return formatDate(this.filterDate, '01.MM.yyyy', 'ru');
  }

  getItems(date: string): Observable<PercentItem[]> {
    return this.http.get<PercentItem[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/percentCharts?date=${date}`);
  }
  addItem(body: PercentItem): Observable<PercentItem> {
    return this.http.post<PercentItem>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/percentCharts`, body);
  }
  removeItem(itemId: number): Observable<any> {
    return this.http.delete<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/percentCharts/${itemId}`);
  }
  updateItem(itemId: number, body: PercentItem): Observable<PercentItem> {
    return this.http.put<PercentItem>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/percentCharts/${itemId}`, body);
  }

  changeCustomLeadPercent(itemId: number, date: string, body: PercentLead): Observable<PercentLead> {
    return this.http.put<PercentLead>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/byUser/${itemId}/changeCustomLeadPercent`,
      body,
      { params: { date } }
    );
  }

  changeCustomInternshipPercent(itemId: number, date: string, customInternshipPercent: any): Observable<any> {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/payedTerms/byUser/${itemId}/changeCustomInternshipPercent`,
      undefined,
      { params: { date, customInternshipPercent } }
    );
  }
}
