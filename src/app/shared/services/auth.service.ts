import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppSettings } from './settings';

export interface User {
  email: string;
  password: string;
}

export enum Roles {
  admin = 1,
  teamlead = 2,
  bayer = 3,
  smart = 4,
  farmerTeamlead = 5,
  farmer = 6,
  helper = 7,
  creative = 8,
  techSpecialist = 9,
  teamLeadTechnicalSpecialist = 10,
  teamLeadPromotion = 11,
  financier = 12,
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  roles = Roles;
  rolesRU = {
    1: 'Фаундер',
    2: 'Тимлид',
    3: 'Баер',
    4: 'Смарт',
    5: 'Фармер Тимлид',
    6: 'Фармер',
    7: 'Хелпер',
    8: 'Креативщик',
    9: 'IT cпециалист',
    10: 'IT Тимлид',
    11: 'Promotion Тимлид',
    12: 'Финансист',
  };
  rolesList: { id: number; name: string }[] = [
    {
      id: 0,
      name: 'Не выбрано',
    },
    ...Object.values(this.roles)
      .filter(el => typeof el === 'number')
      .map(value => ({
        id: +value,
        name: this.rolesRU[+value],
      })),
  ];
  rolesListView = this.rolesList.filter(({ id }) => ![5, 6, 8, 9, 10, 11, 12].includes(id));

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string {
    return localStorage.getItem('token');
  }

  login(user: User): Observable<any> {
    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/accounts/auth`, user).pipe(tap(this.setToken));
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private setToken(response: any): void {
    if (response) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.roleId);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('teamId', response.teamId);
      localStorage.setItem('created_at', response.createdAt);
    }
  }

  changePassword(userId: number, password: string) {
    const body = { userId, password };
    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/accounts/change-password`, body);
  }

  blockUser(id: number) {
    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/accounts/block/${id}`, undefined);
  }
}
