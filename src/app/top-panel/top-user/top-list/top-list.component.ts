import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { IListTopData } from '../top-user-btn/top-user-btn.component';
enum ListTypes {
  team = 'team',
  baer = 'baer',
}

@Component({
  selector: 'app-top-list',
  templateUrl: './top-list.component.html',
  styleUrls: ['./top-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopListComponent {
  public listTypes = ListTypes;
  public listHeaders = {
    team: 'TOП-команд | ROI',
    baer: 'TOП-баеров',
  };
  @Input() listType: string;
  @Input() topList: IListTopData[];
}
