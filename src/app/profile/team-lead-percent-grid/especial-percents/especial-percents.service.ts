import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from '../../../shared/services/settings';

@Injectable({
  providedIn: 'root',
})
export class EspecialPercentsService {
  constructor(private http: HttpClient) {}

  delete(userId, date, especialPercentUserId) {
    return this.http.delete(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/byUser/${userId}/customLeadPercent/DeleteEspecialPercentFromCollection?date=${date}&especialPercentUserId=${especialPercentUserId}`
    );
  }

  update(userId, date, body) {
    return this.http.put(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/byUser/${userId}/customLeadPercent/EditEspecialPercentFromCollection?date=${date}`,
      body
    );
  }

  add(userId, date, body) {
    return this.http.post(
      `${AppSettings.API_PERSONAL_INFRASTRUCTURE}/PayedTerms/byUser/${userId}/customLeadPercent/AddEspecialPercentToCollection?date=${date}`,
      body
    );
  }
}
