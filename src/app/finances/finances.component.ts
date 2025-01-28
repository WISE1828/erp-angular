import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-finances',
  templateUrl: './finances.component.html',
  styleUrls: ['./finances.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancesComponent {}
