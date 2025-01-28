import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { WorkingCapitalService } from '../../../shared/services/working-capital';
import { AuthService } from '../../../shared/services/auth.service';
import { formatDate } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationService } from '../../../shared/services/notification.service';

export enum PaymentTypes {
  QUIWI = 1,
  WEBMONEY = 2,
  CARD_RUB = 3,
  CARD_USD = 5,
}

@UntilDestroy()
@Component({
  selector: 'app-request-item',
  templateUrl: './request-item.component.html',
  styleUrls: ['./request-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestItemComponent {
  public approveAvailable = false;
  public paymentTypes = PaymentTypes;

  @Input() request: any;
  @Input() workingCapitalData: any;
  @Output() deleteRequestItem: EventEmitter<any> = new EventEmitter<any>();
  loading = false;
  role = +localStorage.getItem('role');

  get isPayAvailable() {
    return [
      this.paymentTypes.WEBMONEY,
      this.paymentTypes.QUIWI,
      this.paymentTypes.CARD_RUB,
      this.paymentTypes.CARD_USD,
    ].includes(this.request.paymentInfoType);
  }
  get isApproveAvailable() {
    return this.approveAvailable || !this.isPayAvailable;
  }

  constructor(
    public auth: AuthService,
    public workingCapitalService: WorkingCapitalService,
    public notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {}

  public onDeleteRequestItem(id: number): void {
    this.workingCapitalService
      .deleteMoneyRequest(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.deleteRequestItem.emit(id);
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
  }

  public pay(requestItem): any {
    this.approveAvailable = true;
    const moneyNeed = requestItem.moneyNeed.toString();
    const account = requestItem.paymentInfoName;
    const array = moneyNeed.split('.') || moneyNeed.split(',');
    const [amountInteger, amountFraction] = array;
    const getPaymentUrl = {
      [this.paymentTypes.QUIWI]:
        `https://qiwi.com/payment/form/` +
        `${99}?` +
        `extra['account']=${account}&` +
        `amountInteger=${amountInteger}&` +
        `currency=643&` +
        `amountFraction=${amountFraction || 0}`,
      [this.paymentTypes.WEBMONEY]: 'https://wallet.webmoney.ru/',
      [this.paymentTypes.CARD_RUB]:
        `https://qiwi.com/payment/form/` +
        `${31873}?` +
        `extra['account']=${account}&` +
        `amountInteger=${amountInteger}&` +
        `currency=643&` +
        `amountFraction=${amountFraction || 0}`,
      [this.paymentTypes.CARD_USD]: 'https://wallet.webmoney.ru/',
    };
    const url = getPaymentUrl[requestItem.paymentInfoType] || null;
    if (url) {
      window.open(url, '_blank');
    }
  }

  public approveRequest(requestItem): any {
    this.loading = true;
    const today = new Date();
    const formatedDate = formatDate(today, 'yyyy-MM-dd', 'ru');
    const card = this.workingCapitalData.paymentInfoDailyGroups.find(column => {
      return (
        column[0].name === requestItem.paymentInfoName && column[0].paymentInfoType === requestItem.paymentInfoType
      );
    });
    const currentDateItem = card?.find(item => formatDate(item.date, 'yyyy-MM-dd', 'ru').includes(formatedDate));
    if (!currentDateItem) {
      this.notificationService.showMessage('error', 'Данные по запросу не найдены, обратитесь к фаундеру');
      this.loading = false;
      return;
    }
    currentDateItem.value = currentDateItem.value + requestItem.moneyNeed;
    this.workingCapitalService
      .updateRow([currentDateItem], true)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.onDeleteRequestItem(requestItem.id);
          this.loading = false;
          this.cd.detectChanges();
        },
        () => {
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }
}
