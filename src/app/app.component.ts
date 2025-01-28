import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterEvent } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  public readonly title = 'gipsy-land';
  public expandMenu$ = new BehaviorSubject(true);
  public loading = false;

  constructor(public auth: AuthService, private cd: ChangeDetectorRef, private router: Router) {
    this.loading = false;
    this.router.events.pipe(untilDestroyed(this)).subscribe((e: RouterEvent) => {
      if (e instanceof RouteConfigLoadStart) {
        this.loading = true;
        this.cd.detectChanges();
      } else if (e instanceof RouteConfigLoadEnd) {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }
}
