import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './settings';

export interface newUser {
  email: string;
  roleId: number;
  password: string;
  passwordConfirm: string;
  isRemote: boolean;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private http: HttpClient) {}

  register(newUser: newUser): Observable<any> {
    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/accounts/register`, newUser);
  }
}
