import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-traffic',
  templateUrl: './traffic.component.html',
  styleUrls: ['./traffic.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficComponent implements OnInit {
  navLinks = [
    {
      name: 'Статистика',
      link: './statistic',
      index: 0,
    },
    {
      name: 'Лендинги',
      link: `./landings`,
      index: 1,
    },
    {
      name: 'Офферы',
      link: `./offers`,
      index: 2,
    },
    {
      name: 'Кампании',
      link: `./campaigns`,
      index: 3,
    },
    // {
    //   name: 'Партнерские сети',
    //   link: `./affiliate-network`,
    //   index: 4,
    // },
    {
      name: 'Источники',
      link: `./sources`,
      index: 4,
    },
    {
      name: 'Капы',
      link: `./kpi`,
      index: 5,
    },
    {
      name: 'История',
      link: `./kpi/history`,
      index: 6,
    },
  ];
  activeLinkIndex = 0;

  constructor(private router: Router) {}

  getState() {
    this.activeLinkIndex = this.navLinks.find(tab => tab.link === this.router.url.replace('/traffic', '.'))?.index || 0;
  }

  ngOnInit(): void {
    this.getState();
    this.router.events
      .pipe(
        filter(el => el instanceof NavigationEnd),
        untilDestroyed(this)
      )
      .subscribe(res => {
        this.getState();
      });
  }
}
