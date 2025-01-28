import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MotivationItem } from '../../shared/services/motivations-grid.service';

export enum MotivationsGridState {
  VIEW,
  EDIT,
}

@Component({
  selector: 'app-motivations-grid',
  templateUrl: './motivations-grid.component.html',
  styleUrls: ['./motivations-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotivationsGridComponent {
  state = MotivationsGridState.VIEW;
  isReload: boolean = false;
  item: MotivationItem;

  view() {
    this.state = MotivationsGridState.VIEW;
    this.isReload = true;
  }
  edit(item: MotivationItem = null) {
    this.item = item;
    this.state = MotivationsGridState.EDIT;
    this.isReload = false;
  }
}
