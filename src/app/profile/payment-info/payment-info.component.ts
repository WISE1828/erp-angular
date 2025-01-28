import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserInfoService } from '../../shared/services/user-info.service';
import { NotificationService } from '../../shared/services/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-payment-info',
  templateUrl: './payment-info.component.html',
  styleUrls: ['./payment-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentInfoComponent {
  @Input() isAccessToCreate = false;
  @Input() isAccessToDelete = false;
  @Input() userInfo = null;
  loading = false;
  paymentInfoTypeList = this.userInfoService.paymentInfoTypes;
  isPaymentCreate = false;
  paymentForm = new FormGroup({
    paymentInfoType: new FormControl(null, []),
    name: new FormControl(null, [Validators.required]),
  });

  constructor(
    private userInfoService: UserInfoService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<PaymentInfoComponent>,
    private cd: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.isAccessToCreate = data?.isAccessToCreate;
    this.isAccessToDelete = data?.isAccessToDelete;
    this.userInfo = data?.userInfo;
  }

  get paymentInfoList() {
    return this.userInfo?.paymentInfo || [];
  }
  get isEmpty() {
    return !this.userInfo?.paymentInfo?.length && !this.isPaymentCreate;
  }

  add(): void {
    this.isPaymentCreate = true;
    this.paymentForm = new FormGroup({
      paymentInfoType: new FormControl(this.paymentInfoTypeList[0].paymentInfoType, []),
      name: new FormControl(null, [Validators.required]),
    });
  }
  delete(item): void {
    this.loading = true;
    this.userInfoService
      .deletePaymentInfoItem(this.userInfo.id, item.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.userInfo.paymentInfo = this.userInfo.paymentInfo.filter(el => el.id !== item.id);
          this.loading = false;
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При удалении платежных данных произошла ошибка');
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }

  closePaymentItem(): void {
    this.paymentForm.reset();
    this.isPaymentCreate = false;
  }

  createPaymentItem(): void {
    if (!this.paymentForm.touched || this.paymentForm.invalid) {
      return;
    }
    this.loading = true;
    if (+this.paymentForm.value.paymentInfoType === 1 && this.paymentForm.value.name[0] === '8') {
      this.paymentForm.value.name = `+7${this.paymentForm.value.name.slice(1)}`;
    }
    this.userInfoService
      .updateUserPaymentInfo(this.userInfo.id, this.paymentForm.value)
      .pipe(untilDestroyed(this))
      .subscribe(
        response => {
          this.userInfo.paymentInfo.push(response);
          this.closePaymentItem();
          this.loading = false;
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При добавлении платежных данных произошла ошибка');
          this.closePaymentItem();
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }
}
