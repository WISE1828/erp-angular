import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent implements OnInit, OnDestroy {
  errorMessage: string;
  type: string;
  errorSub: Subscription;
  constructor(private notificationService: NotificationService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.errorSub = this.notificationService.error$.pipe(untilDestroyed(this)).subscribe(body => {
      this.errorMessage = body.text;
      this.type = body.type;
      this.cd.detectChanges();
      setTimeout(() => {
        this.errorMessage = null;
        this.cd.detectChanges();
      }, 5000);
    });
  }

  ngOnDestroy(): void {
    if (this.errorSub) {
      this.errorSub.unsubscribe();
    }
  }

  closeAlert(): void {
    this.errorMessage = null;
  }
}
