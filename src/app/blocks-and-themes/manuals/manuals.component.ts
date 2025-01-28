import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-manuals',
  templateUrl: './manuals.component.html',
  styleUrls: ['./manuals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualsComponent {
  public readonly GUIDE_BLOCK_TYPE = '1';
  constructor() {}
}
