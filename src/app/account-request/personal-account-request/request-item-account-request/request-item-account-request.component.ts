import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import { AccountRequestService, IAccountRequest } from '../../../shared/services/account-request.service';
import { map } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-request-item-account-request',
  templateUrl: './request-item-account-request.component.html',
  styleUrls: [
    './request-item-account-request.component.scss',
    '../creating-request-item/creating-request-item.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestItemAccountRequestComponent {
  @Input() request: IAccountRequest;
  @Input() isReadOnly: boolean = false;
  @Input() accountRequestData: any;
  @Output() deleteRequestItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() updateRequest: EventEmitter<any> = new EventEmitter<any>();
  role = +localStorage.getItem('role');
  userId = localStorage.getItem('userId');
  operatorId = new FormControl(this.role === this.auth.roles.farmer ? this.userId : null, [Validators.required]);
  users$ = this.accountRequestService.usersList.pipe(
    map(users => users.map(user => ({ value: user.id, label: user.userName })))
  );

  get isApproveAvailable() {
    return (
      [this.auth.roles.admin, this.auth.roles.farmer, this.auth.roles.farmerTeamlead].includes(this.role) &&
      this.operatorId.valid
    );
  }

  get isAdminOrTeamLeadFarmer() {
    return [this.auth.roles.admin, this.auth.roles.farmerTeamlead].includes(this.role);
  }

  constructor(public auth: AuthService, public accountRequestService: AccountRequestService) {}

  public onDeleteRequestItem(id: number): void {
    this.accountRequestService
      .deleteAccountRequest(id)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.deleteRequestItem.emit(id);
      });
  }

  public approveRequest(requestItem): any {
    const currentDateItem = {
      ...requestItem,
      date: requestItem.date,
      isApproved: true,
      operatorId: +this.operatorId.value,
      geoId: requestItem.geo.id,
    };
    delete currentDateItem.geo;
    this.accountRequestService
      .editAccountRequest(currentDateItem)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateRequest.emit(requestItem.id);
      });
  }
}
