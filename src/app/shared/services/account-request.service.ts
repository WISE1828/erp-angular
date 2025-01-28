import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { AppSettings } from './settings';
import { IUserInfo } from './user-info.service';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AccountRequestService {
  public selectedDate: string = null;
  public selectedRowId: BehaviorSubject<number> = new BehaviorSubject<number>(null);

  countriesList: BehaviorSubject<ICountry[]> = new BehaviorSubject([]);
  usersList: BehaviorSubject<IUserInfo[]> = new BehaviorSubject([]);
  get storedData() {
    const storedCountries = JSON.parse(localStorage.getItem('countries'));
    const storedFarmers = JSON.parse(localStorage.getItem('farmers'));
    if (storedCountries?.length && storedFarmers?.length) {
      this.countriesList.next(storedCountries);
      this.usersList.next(storedFarmers);
      return of([storedFarmers, storedCountries]);
    }
    return combineLatest(this.getCountries(), this.getUsersByRole(5), this.getUsersByRole(6)).pipe(
      map(([countries, farmersTL, farmers]) => {
        localStorage.setItem('countries', JSON.stringify(countries));
        localStorage.setItem('farmers', JSON.stringify([...farmersTL, ...farmers]));
        this.countriesList.next(countries);
        this.usersList.next([...farmersTL, ...farmers]);
        return [[...farmersTL, ...farmers], countries];
      }),
      shareReplay(1)
    );
  }

  constructor(private http: HttpClient) {}

  public getAccountRequestData(userId, date): Observable<IAccountRequestTerm> {
    return this.http.get<IAccountRequestTerm>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/AccountRequest/personal/byMonthAndUserId`,
      { params: { userId, date } }
    );
  }
  public getCommonAccountRequestData(date): Observable<ICommonAccountRequest[]> {
    return this.http.get<ICommonAccountRequest[]>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/AccountRequest/common/byMonthAndTeamId`,
      { params: { date } }
    );
  }
  public createAccountRequest(body: ICreateOrEditAccountRequest): Observable<any> {
    return this.http.post<IAccountRequest>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/AccountRequest`, body);
  }
  public editAccountRequest(body: ICreateOrEditAccountRequest): Observable<any> {
    return this.http.put<IAccountRequest>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/AccountRequest/${body.id}`, body);
  }
  public deleteAccountRequest(id: number): Observable<any> {
    return this.http.delete<IAccountRequest>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/AccountRequest/${id}`);
  }

  public getAccountRequestTerms(date) {
    return this.http.get<IAccountRequestTerm>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/AccountRequest/terms/byMonth`,
      { params: { date } }
    );
  }

  public getUsersByRole(roleId: number): Observable<IUserInfo[]> {
    return this.http.get<IUserInfo[]>(`${AppSettings.API_IDENTITY_ENDPOINT}/Identity/users/byRole/${roleId}`);
  }
  public getCountries(): Observable<ICountry[]> {
    return this.http.get<ICountry[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Countries`);
  }
}

export interface ICommonAccountRequest {
  cost: number;
  count: number;
  roleId: number;
  teamId: number;
  userId: number;
  userName: string;
  unhandledRequestCount: number;
}
export interface IAccountRequest {
  id: number;
  date: string;
  count: number;
  isApproved: boolean;
  cost: number;
  description: string;
  geo: ICountry;
  termId: number;
  operatorId: number;
}
export interface ICountry {
  id: number;
  name: string;
  shortName: string;
  iso_code: string;
  iso_code2: string;
  iso_code3: string;
}
export interface ICreateOrEditAccountRequest {
  id: number;
  date?: string;
  count: number;
  cost: number;
  isApproved: boolean;
  description: string;
  termId?: number;
  geoId: number;
  operatorId?: number;
}
export interface IAccountRequestTermUser {
  userId: number;
  username: string;
  teamId: number;
  roleId: number;
}
export interface IAccountRequestTerm {
  accountRequests: IAccountRequest[];
  finishDate: string;
  id: number;
  isActive: true;
  startDate: string;
  termUserInfo: IAccountRequestTermUser;
}
