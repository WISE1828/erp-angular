import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

interface INotification {
  type: string;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  public error$ = new Subject<INotification>();

  showMessage(type: string, text: string): void {
    const body = { type, text };
    this.error$.next(body);
  }
}
