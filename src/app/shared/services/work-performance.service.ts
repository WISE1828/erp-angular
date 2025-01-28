import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppSettings } from './settings';
import { MatDialog } from '@angular/material/dialog';
import { BudgetListComponent } from '../../profile/additionaly/budget/budget-list/budget-list.component';
import { catchError } from 'rxjs/operators';

export interface IPersonalBudget {
  id: number;
  userId: number;
  budget: number;
  workPerformanceId: number;
}

export interface IWorkPerformance {
  id?: number;
  teamId: number;
  date: string;
  commonBudget: number;
  personalBudgets: IPersonalBudget[];
}

@Injectable({
  providedIn: 'root',
})
export class WorkPerformanceService {
  constructor(private http: HttpClient, private dialog: MatDialog) {}

  getList(date: string): Observable<IWorkPerformance[]> {
    const headers = new HttpHeaders({ 'With-Out-Errors': '404' });
    return this.http.get<IWorkPerformance[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkPerfomance`, {
      headers,
      params: { date },
    });
  }
  create(payload: IWorkPerformance): Observable<IWorkPerformance> {
    return this.http.post<IWorkPerformance>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkPerfomance`, payload);
  }
  updateById(id: string, payload: IWorkPerformance): Observable<IWorkPerformance> {
    return this.http.put<IWorkPerformance>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkPerfomance/${id}`, payload);
  }

  getBudgetById(id: string, date: string): Observable<IPersonalBudget> {
    const headers = new HttpHeaders({ 'With-Out-Errors': '404' });
    return this.http
      .get<IPersonalBudget>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkPerfomance/budgets/byUserId/${id}`, {
        headers,
        params: { date },
      })
      .pipe(catchError(() => of({ budget: null } as any)));
  }
  createBudget(payload: IPersonalBudget): Observable<IPersonalBudget> {
    return this.http.post<IPersonalBudget>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkPerfomance/budgets`,
      payload
    );
  }
  updateBudgetById(id: string, payload: IPersonalBudget): Observable<IPersonalBudget> {
    return this.http.put<IPersonalBudget>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/WorkPerfomance/budgets/${id}`,
      payload
    );
  }

  showDialog() {
    this.dialog.open(BudgetListComponent, {
      autoFocus: false,
      hasBackdrop: true,
    });
  }
}
