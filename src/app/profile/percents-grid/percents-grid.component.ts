import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { PercentItem } from '../../shared/services/percents-grid.service';

export enum PercentsGridState {
  VIEW,
  EDIT,
}

@Component({
  selector: 'app-percents-grid',
  templateUrl: './percents-grid.component.html',
  styleUrls: ['./percents-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentsGridComponent {
  state = PercentsGridState.VIEW;
  isReload: boolean = false;
  item: PercentItem;

  view() {
    this.state = PercentsGridState.VIEW;
    this.isReload = true;
  }
  edit(item: PercentItem = null) {
    this.item = item;
    this.state = PercentsGridState.EDIT;
    this.isReload = false;
  }
}
