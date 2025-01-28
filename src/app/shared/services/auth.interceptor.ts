import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  public readonly RATE_URL = 'https://api.exchangeratesapi.io/latest?base=USD';
  constructor(private auth: AuthService, private router: Router, private notificationService: NotificationService) {}

  private logout() {
    this.auth.logout();
    this.router.navigate(['/login'], {
      queryParams: {
        authFailed: true,
      },
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.auth.isAuthenticated() && req.url !== this.RATE_URL) {
      req = req.clone({
        setHeaders: {
          Authorization: 'Bearer ' + this.auth.token,
        },
      });
    }
    let skipErrors = [];
    if (req.headers.has('With-Out-Errors')) {
      skipErrors = req.headers
        .get('With-Out-Errors')
        .split(',')
        .map(el => +el.trim());
      req.headers.delete('With-Out-Errors');
    }
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const checkStatus = code => error.status === code && !skipErrors.includes(code);

        console.log('[Interceptor Error]: ', error);

        if (checkStatus(401)) {
          this.logout();
        }
        if (checkStatus(403)) {
          this.router.navigate(['/']);
          setTimeout(() => this.notificationService.showMessage('error', 'Доступ запрещен'), 0);
        }
        if (checkStatus(404)) {
          this.notificationService.showMessage('error', 'Данные не найдены');
        }

        return throwError(error);
      })
    );
  }
}
