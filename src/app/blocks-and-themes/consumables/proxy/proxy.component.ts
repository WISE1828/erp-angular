import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-proxy',
  templateUrl: './proxy.component.html',
  styleUrls: ['./proxy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProxyComponent {
  public readonly GUIDE_BLOCK_TYPE = '4';
  constructor() {}
}
