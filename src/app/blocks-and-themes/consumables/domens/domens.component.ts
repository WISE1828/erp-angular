import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-domens',
  templateUrl: './domens.component.html',
  styleUrls: ['./domens.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomensComponent {
  public readonly GUIDE_BLOCK_TYPE = '3';
  constructor() {}
}
