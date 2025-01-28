import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TrackersListComponent } from '../../profile/additionaly/trackers/trackers-list/trackers-list.component';
import { AppSettings } from './settings';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ITracker {
  id: number;
  keitaroUrl: string;
  adminApiKey: string;
  users: ITrackerUser[];
}

export interface ITrackerUser {
  id: number;
  username: string;
  roleId: number;
  teamId: number;
  isBlocked: boolean;
  partnerNetworkIdentityKeysBunch: any;
}

@Injectable({
  providedIn: 'root',
})
export class TrackersService {
  constructor(private http: HttpClient, private dialog: MatDialog) {}

  showDialog() {
    this.dialog.open(TrackersListComponent, {
      autoFocus: false,
      hasBackdrop: true,
    });
  }

  getTrackers(): Observable<ITracker[]> {
    return this.http.get<ITracker[]>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Identity/teams`);
  }

  updateTracker(tracker: ITracker): Observable<ITracker> {
    return this.http.put<ITracker>(`${AppSettings.API_PARTNER_NETWORK_VIEWER}/Identity/teams`, tracker);
  }
}
