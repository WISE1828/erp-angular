import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../shared/services/auth.service';
import { UserInfoService } from '../../../shared/services/user-info.service';

@Component({
  selector: 'app-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentItemComponent implements OnInit {
  paymentInfoTypes = this.userInfoService.paymentInfoTypes;
  role: number;

  @Input() item;
  @Input() loading = false;
  @Input() isAccessToDelete = false;
  @Output() delete: EventEmitter<any> = new EventEmitter();
  constructor(public auth: AuthService, private userInfoService: UserInfoService) {}

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
  }

  deletePaymentItem(): void {
    this.delete.emit(this.item);
  }

  getName(): string {
    return this.paymentInfoTypes.find(type => +type.paymentInfoType === this.item.paymentInfoType).name;
  }
}
