import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent {
  public readonly GUIDE_BLOCK_TYPE = '6';
  constructor() {}
}
