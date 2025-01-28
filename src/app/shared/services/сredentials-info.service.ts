import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from './settings';

export interface CredentialInfo {
  id: number;
  name: string;
  url: string;
  login: string;
  password: string;
  guideThemeId: number;
}

export interface CredentialInfoThemes {
  id: number;
  name: string;
  serviceCredentialsInfoDtos: CredentialInfo[];
  guideThemeType: number;
}

@Injectable({
  providedIn: 'root',
})
export class CredentialsInfoService {
  constructor(private http: HttpClient) {}

  list(): Observable<CredentialInfoThemes> {
    return this.http.get<CredentialInfoThemes>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/serviceCredentialsInfoThemes`
    );
  }
  create(payload: CredentialInfo): Observable<CredentialInfo> {
    return this.http.post<CredentialInfo>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/serviceCredentialsInfo`,
      payload
    );
  }
  update(id: string, payload: CredentialInfo): Observable<CredentialInfo> {
    return this.http.put<CredentialInfo>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/serviceCredentialsInfo/${id}`,
      payload
    );
  }
  delete(id: string): Observable<any> {
    return this.http.delete<CredentialInfo>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/serviceCredentialsInfo/${id}`
    );
  }
}
