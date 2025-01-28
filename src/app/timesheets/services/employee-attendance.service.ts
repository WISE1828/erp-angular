import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IVisitLogRow } from '../interfaces/visit-log-row.interface';
import { IVisitLogCell } from '../interfaces/visit-log-cell.interface';
import { AppSettings } from '../../shared/services/settings';

@Injectable()
export class EmployeeAttendanceService {
  url = window.location.origin + `/assets/employee-attendance.json`;
  // data: IVisitLogCell[] = [
  //   {
  //     userName: 'Владелец рычага',
  //     visitLogCells: [
  //       {
  //         id: 0,
  //         date: '2020-06-1',
  //         visitType: 'Стажировка',
  //         termId: 0,
  //       },
  //       {
  //         id: 1,
  //         date: '2020-06-2',
  //         visitType: 'Стажировка',
  //         termId: 0,
  //       },
  //       {
  //         id: 2,
  //         date: '2020-06-3',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 3,
  //         date: '2020-06-4',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 4,
  //         date: '2020-06-5',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 5,
  //         date: '2020-06-6',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 6,
  //         date: '2020-06-7',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 7,
  //         date: '2020-06-8',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 8,
  //         date: '2020-06-9',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 9,
  //         date: '2020-06-10',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 10,
  //         date: '2020-06-11',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 11,
  //         date: '2020-06-12',
  //         visitType: 'Дистанционное присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 12,
  //         date: '2020-06-13',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 13,
  //         date: '2020-06-14',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 14,
  //         date: '2020-06-15',
  //         visitType: 'Опоздание',
  //         termId: 0,
  //       },
  //       {
  //         id: 15,
  //         date: '2020-06-16',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 16,
  //         date: '2020-06-17',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 17,
  //         date: '2020-06-18',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 18,
  //         date: '2020-06-19',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 19,
  //         date: '2020-06-20',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 20,
  //         date: '2020-06-21',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 21,
  //         date: '2020-06-22',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 22,
  //         date: '2020-06-23',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 23,
  //         date: '2020-06-24',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 24,
  //         date: '2020-06-25',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 25,
  //         date: '2020-06-26',
  //         visitType: 'Отсутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 26,
  //         date: '2020-06-27',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 27,
  //         date: '2020-06-28',
  //         visitType: 'Выходной',
  //         termId: 0,
  //       },
  //       {
  //         id: 28,
  //         date: '2020-06-29',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //       {
  //         id: 29,
  //         date: '2020-06-30',
  //         visitType: 'Присутствие',
  //         termId: 0,
  //       },
  //     ],
  //   },
  //
  // ];

  constructor(public http: HttpClient) {}

  /**
   * Получение табеля посещаемости сотрудников за период времени
   * @param date - период (начальная и конечная даты)
   */
  getVisitList(date: string): Observable<IVisitLogRow[]> {
    return this.http.get<IVisitLogRow[]>(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/VisitLogs/terms/byMonth`, {
      params: { date },
    });
  }

  /**
   * Изменение ячейки
   * @param visitLogCell - ячейка
   */
  updateVisitItem(visitLogCell: IVisitLogCell): Observable<IVisitLogCell> {
    return this.http.put<IVisitLogCell>(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/VisitLogs/cells/${visitLogCell.id}`,
      visitLogCell
    );
  }
}
