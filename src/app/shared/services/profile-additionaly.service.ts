import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './settings';

@Injectable({
  providedIn: 'root',
})
export class ProfileAdditionalyService {
  constructor(private http: HttpClient) {}

  public getTrackers(): Observable<Tracker> {
    return this.http.get<Tracker>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Identity/Trackers`);
  }

  public synchronize(apiKey: string) {
    const params = {
      apiKey,
    };
    return this.http.post<any[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Identity/Synchronize`, undefined, {
      params,
    });
  }
}

export interface Tracker {
  keitaro: Keitaro;
}

export interface Keitaro {
  name: string;
  isSynchronized: boolean;
  token: string;
}
