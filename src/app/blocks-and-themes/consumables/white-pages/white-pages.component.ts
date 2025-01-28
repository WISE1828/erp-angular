import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-white-pages',
  templateUrl: './white-pages.component.html',
  styleUrls: ['./white-pages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhitePagesComponent {
  public readonly GUIDE_BLOCK_TYPE = '5';
  constructor() {}
}
