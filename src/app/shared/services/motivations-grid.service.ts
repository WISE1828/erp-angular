import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from './settings';
import * as moment from 'moment';
import { formatDate } from '@angular/common';

export interface QuantityBonusInfo {
  bonus: number;
  quantity: number;
}
export interface MotivationChart {
  id: number;
  name: string;
  date?: string;
  quantityName: string;
  quantitySign: string;
  bonusName: string;
  bonusSign: string;
  quantityBonusInfoCollection: QuantityBonusInfo[];
}
export interface MotivationItem extends MotivationChart {}

@Injectable({
  providedIn: 'root',
})
export class MotivationsGridService {
  filterDate = moment().startOf('month').toDate();

  constructor(private http: HttpClient) {}

  get formatedDate() {
    return formatDate(this.filterDate, '01.MM.yyyy', 'ru');
  }

  getItems(date: string): Observable<MotivationItem[]> {
    return this.http.get<MotivationItem[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/motivationCharts?date=${date}`);
  }
  addItem(body: MotivationItem): Observable<MotivationItem> {
    return this.http.post<MotivationItem>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/motivationCharts`, body);
  }
  removeItem(itemId: number): Observable<any> {
    return this.http.delete<any>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/motivationCharts/${itemId}`);
  }
  updateItem(itemId: number, body: MotivationItem): Observable<MotivationItem> {
    return this.http.put<MotivationItem>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/motivationCharts/${itemId}`, body);
  }

  setMotivationChart(itemId: number, date: string, motivationChartId): Observable<any> {
    return this.http.put<any>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/motivationCharts/users/${itemId}/setMotivationChart`,
      undefined,
      { params: { date, motivationChartId } }
    );
  }
}
