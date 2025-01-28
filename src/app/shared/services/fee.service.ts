import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AppSettings } from './settings';
import { FeeListComponent } from '../../profile/additionaly/fee/fee-list/fee-list.component';

export interface AdditionalFee {
  id: number;
  benefeciaryId: number;
  username: string;
  payedTermId: number;
  profitPercent: number;
}

@Injectable({
  providedIn: 'root',
})
export class FeeService {
  constructor(private http: HttpClient, private dialog: MatDialog) {}

  getList(id: string, date: string): Observable<AdditionalFee[]> {
    const headers = new HttpHeaders({ 'With-Out-Errors': '404' });
    return this.http.get<AdditionalFee[]>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/AdditionalFee/byBenefeciaryId/${id}`,
      {
        headers,
        params: { date },
      }
    );
  }
  create(id: string, date: string, payload: AdditionalFee): Observable<AdditionalFee> {
    return this.http.post<AdditionalFee>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/AdditionalFee/byUserId/${id}`,
      payload,
      {
        params: { date },
      }
    );
  }
  updateById(id: string, payload: AdditionalFee): Observable<AdditionalFee> {
    return this.http.put<AdditionalFee>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/AdditionalFee/${id}`,
      payload
    );
  }
  deleteById(id: string) {
    return this.http.delete<AdditionalFee>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/AdditionalFee/${id}`);
  }

  showDialog() {
    this.dialog.open(FeeListComponent, {
      autoFocus: false,
      hasBackdrop: true,
    });
  }
}
