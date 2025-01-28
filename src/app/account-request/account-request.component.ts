import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AccountRequestService } from '../shared/services/account-request.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-account-request',
  templateUrl: './account-request.component.html',
  styleUrls: ['./account-request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRequestComponent implements OnInit {
  constructor(
    private accountRequestService: AccountRequestService,
    public auth: AuthService,
    private http: HttpClient
  ) {}

  sendJWT(): void {
    const headers = { 'Content-Type': 'application/json' };
    const farmingurl = 'https://g-go-farming.azurewebsites.net/v2/auth/token/put';
    this.http
      .post(farmingurl, { token: this.auth.token }, { headers })
      .toPromise()
      .then((data: any) => {
        console.log(data);
      });
  }

  ngOnInit(): void {
    this.accountRequestService.storedData.subscribe();
    this.sendJWT();
  }
}
