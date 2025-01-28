import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ITeamTopStatisticsItem,
  IUserTopStatistics,
  UserInfoService,
} from '../../../shared/services/user-info.service';

export interface IListTopData {
  name: string;
  value: number;
}

interface ITopData {
  teamTopStatistics: IListTopData[];
  userTopStatistics: IListTopData[];
}

@Component({
  selector: 'app-top-user-btn',
  templateUrl: './top-user-btn.component.html',
  styleUrls: ['./top-user-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopUserBtnComponent implements OnInit {
  public isOpen = false;
  public topData$: Observable<ITopData>;
  constructor(private userInfoService: UserInfoService) {}

  ngOnInit(): void {
    const currentDate = moment().format('DD.MM.YYYY');
    this.topData$ = this.userInfoService.getTopInfo(currentDate).pipe(
      map(data => ({
        teamTopStatistics: this.prepareListData(data.teamTopStatistics),
        userTopStatistics: this.prepareListData(data.userTopStatistics),
      }))
    );
  }

  private prepareListData(list: (ITeamTopStatisticsItem | IUserTopStatistics)[]): IListTopData[] {
    return list.reduce((acc, item) => {
      acc.push({
        name: 'teamId' in item ? `Команда №${item?.teamId}` : item?.username,
        value: item.profit,
      });
      return acc;
    }, []);
  }
}
