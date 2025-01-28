import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './settings';

@Injectable({ providedIn: 'root' })
export class BlocksAndThemesService {
  constructor(private http: HttpClient) {}

  public getThemes(guideThemeType: string): Observable<ITheme[]> {
    return this.http.get<ITheme[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/guideThemes/byThemeType`, {
      params: { guideThemeType },
    });
  }

  public getGuide(id: number) {
    return this.http.get<IGuide>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/templates/${id}`);
  }

  public deleteGuide(guideBlockType: number): Observable<IGuide> {
    return this.http.delete<IGuide>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/templates/${guideBlockType}`);
  }

  public addGuide(guide: IGuide): Observable<IGuide> {
    return this.http.post<IGuide>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/templates`, guide);
  }

  public editGuide(id: number, guide: IGuide): Observable<IGuide> {
    return this.http.put<IGuide>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/templates/${id}`, guide);
  }

  public createTheme(theme: ITheme): Observable<ITheme> {
    return this.http.post<ITheme>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/themes`, theme);
  }

  public deleteTheme(id: number): Observable<void> {
    return this.http.delete<void>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/Guides/themes/${id}`);
  }

  public loadImg(img: FormData): Observable<string> {
    return this.http.post(`${AppSettings.API_IDENTITY_ENDPOINT}/Identity/uploadImage`, img, {
      responseType: 'text',
    });
  }
}

export enum GuideThemeType {
  None = 0,
  Manuals = 1,
  Accounts = 2,
  Domens = 3,
  Proxy = 4,
  WhitePages = 5,
  Payments = 6,
  Passwords = 7,
}

export interface ITheme {
  id: number;
  name: string;
  guideTemplates: IGuide[];
  guideThemeType: GuideThemeType;
}

export interface IGuide {
  guideThemeId: number;
  id: number;
  meta: string;
  name: string;
  pictureLink: string;
}
