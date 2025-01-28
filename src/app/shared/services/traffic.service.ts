import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from './settings';
import { shareReplay, tap } from 'rxjs/operators';
import { MotivationItem } from './motivations-grid.service';
import { KpiItem } from '../../traffic/kpi/kpi-create-dialog/kpi-create-dialog.component';

export interface IDashboardItem {
  bot_share: number;
  day_hour?: number;
  day?: number;
  clicks: number;
  campaign_unique_clicks: number;
  conversions: number;
  cost: number;
  sale_revenue: number;
  profit_confirmed: number;
  roi_confirmed: number;
}
export interface IDateParams {
  startDate: string;
  finishDate: string;
  isTimeInterval: any;
}
export enum ReportGrouping {
  None = 0,
  day_hour = 1,
  campaign = 2,
  offer = 3,
  day = 4,
}
export interface IFilter {
  userIds: number[];
  groupIds: number[];
  grouping: ReportGrouping;
  teamId: number;
  campaignId?: number;
  metrics: string[];
}

export interface IGrouped {
  id: number;
  username: string;
  roleId: number;
  teamId: number;
  partnerNetworkIdentityKeysBunch: {
    keitaroKeys: {
      keitaroId: number;
      apiKey: string;
      keitaroUrl: string;
      campaignGroupId: number;
      landingGroupId: number;
      offerGroupId: number;
    };
  };
  team: any;
}
export interface ICampaings {
  id: number;
  name: string;
  group_id: number;
  userId: number;
  teamId: number;
}

@Injectable({
  providedIn: 'root',
})
export class TrafficService {
  constructor(private http: HttpClient) {}

  metrics = [];
  offersMetrics = [];
  offerTemplates = [];
  landingsMetrics = [];

  public getDashboard(queryParams: Partial<IDateParams>, filters: Partial<IFilter>): Observable<IDashboardItem[]> {
    const params = { ...queryParams };
    return this.http.post<IDashboardItem[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Campaigns/dashboard`, filters, {
      params,
    });
  }

  public getMetrics(): Observable<string[]> {
    return this.metrics?.length
      ? of(this.metrics)
      : this.http
          .get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Campaigns/metrics`)
          .pipe(tap(d => (this.metrics = d)));
  }

  public getGrouped(): Observable<IGrouped[][]> {
    return this.http
      .get<IGrouped[][]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Identity/users/grouped`)
      .pipe(shareReplay(1));
  }

  public getCampaigns(): Observable<ICampaings[]> {
    return this.http.get<ICampaings[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Campaigns`).pipe(shareReplay(1));
  }

  //

  public getOffersMetrics(): Observable<string[]> {
    return this.offersMetrics?.length
      ? of(this.offersMetrics)
      : this.http
          .get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/metrics`)
          .pipe(tap(d => (this.offersMetrics = d)));
  }
  public getOffers(queryParams: Partial<IDateParams>, filters: Partial<IFilter>): Observable<IDashboardItem[]> {
    const params = { ...queryParams };
    return this.http
      .post<IDashboardItem[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/statistic`, filters, {
        params,
      })
      .pipe(shareReplay(1));
  }

  //
  public getLandingsMetrics(): Observable<string[]> {
    return this.landingsMetrics?.length
      ? of(this.landingsMetrics)
      : this.http
          .get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Landings/metrics`)
          .pipe(tap(d => (this.landingsMetrics = d)));
  }
  public getLandings(queryParams: Partial<IDateParams>, filters: Partial<IFilter>): Observable<IDashboardItem[]> {
    const params = { ...queryParams };
    return this.http
      .post<IDashboardItem[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Landings/statistic`, filters, {
        params,
      })
      .pipe(shareReplay(1));
  }

  //
  public getCampaignsStatistic(
    queryParams: Partial<IDateParams>,
    filters: Partial<IFilter>
  ): Observable<IDashboardItem[]> {
    const params = { ...queryParams };
    return this.http
      .post<IDashboardItem[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Campaigns/statistic`, filters, {
        params,
      })
      .pipe(shareReplay(1));
  }

  //
  public getTrafficSourcesMetrics(): Observable<string[]> {
    return this.landingsMetrics?.length
      ? of(this.landingsMetrics)
      : this.http
          .get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/TrafficSources/metrics`)
          .pipe(tap(d => (this.landingsMetrics = d)));
  }
  public getTrafficSources(queryParams: Partial<IDateParams>, filters: Partial<IFilter>): Observable<IDashboardItem[]> {
    const params = { ...queryParams };
    return this.http
      .post<IDashboardItem[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/TrafficSources/statistic`, filters, {
        params,
      })
      .pipe(shareReplay(1));
  }

  // Offers
  public getOfferTemplates(): Observable<string[]> {
    return this.http.get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/offerTemplates`);
  }
  public addOfferTemplates(body: KpiItem): Observable<KpiItem> {
    return this.http.post<KpiItem>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/offerTemplates`, body);
  }
  public updateOfferTemplates(id: string, body: KpiItem): Observable<KpiItem> {
    return this.http.put<KpiItem>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/offerTemplates/${id}`, body);
  }

  public getTeamOfferTemplates(teamId): Observable<string[]> {
    return this.http.get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/teamOfferTemplates`, {
      params: { teamId },
    });
  }
  public updateTeamOfferTemplates(id: string, body: { cap: number; comment: string }): Observable<KpiItem> {
    return this.http.put<KpiItem>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/teamOfferTemplates/${id}`, body);
  }

  public getUserOfferTemplates(userId): Observable<string[]> {
    return this.http.get<string[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/userOfferTemplates`, {
      params: { userId },
    });
  }
  public updateUserOfferTemplates(id: string, body: { cap: number; comment: string }): Observable<KpiItem> {
    return this.http.put<KpiItem>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/userOfferTemplates/${id}`, body);
  }

  // History
  public getOfferTemplateHistories(date): Observable<any[]> {
    return this.http.get<any[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/offerTemplateHistories`, {
      params: { date },
    });
  }
  public getTeamTemplateHistories(teamId, date): Observable<any[]> {
    return this.http.get<any[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/teamTemplateHistories`, {
      params: { teamId, date },
    });
  }
  public getUserTemplateHistories(userId, date): Observable<any[]> {
    return this.http.get<any[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Offers/userTemplateHistories`, {
      params: { userId, date },
    });
  }
}
