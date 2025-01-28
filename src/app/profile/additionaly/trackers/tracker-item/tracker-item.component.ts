import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProfileAdditionalyService } from '../../../../shared/services/profile-additionaly.service';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from '../../../../shared/services/notification.service';
import { TrackersService } from '../../../../shared/services/trackers.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { UserInfoService } from '../../../../shared/services/user-info.service';

@Component({
  selector: 'app-tracker-item',
  templateUrl: './tracker-item.component.html',
  styleUrls: ['./tracker-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackerItemComponent implements OnInit {
  role;
  loading = false;
  token = '';
  lastToken = '';
  selectedTeam;
  teamList$ = this.trackersService.getTrackers();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private profileAdditionalyService: ProfileAdditionalyService,
    private notificationService: NotificationService,
    private trackersService: TrackersService,
    private userInfoService: UserInfoService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<TrackerItemComponent>,
    private cd: ChangeDetectorRef
  ) {
    this.token = data.token;
    this.lastToken = this.token;
  }

  ngOnInit() {
    this.role = +localStorage.getItem('role');
  }

  get isAccessToSave() {
    return (!this.isAdmin && this.lastToken != this.token) || (this.isAdmin && this.selectedTeam);
  }

  synchronize(): void {
    this.loading = true;

    const actionSync = this.profileAdditionalyService.synchronize(this.token).pipe(
      map(data => {
        this.loading = false;
        this.lastToken = this.token;
        this.notificationService.showMessage('success', `Синхронизация с ${this.data?.title || ''} прошла успешно`);
        this.dialogRef.close(true);
        this.cd.detectChanges();
        return data;
      }),
      catchError(err => {
        this.loading = false;
        this.token = this.lastToken;
        this.notificationService.showMessage('error', 'При синхронизации произошла ошибка');
        this.cd.detectChanges();
        return err;
      })
    );
    const actionTrackerUpdate = this.trackersService.updateTracker(this.selectedTeam).pipe(
      map(data => {
        this.loading = false;
        this.notificationService.showMessage('success', `Обновление прошло успешно`);
        this.cd.detectChanges();
        return data;
      }),
      catchError(err => {
        this.loading = false;
        this.notificationService.showMessage('error', 'При обновлении произошла ошибка');
        this.cd.detectChanges();
        return err;
      })
    );

    const saveAction = this.isAdmin ? actionTrackerUpdate : actionSync;

    saveAction.subscribe();
  }

  get isAdmin() {
    return (
      [+this.auth.roles.admin].includes(+this.role) && this.userInfoService.userInfo?.roleId === +this.auth.roles.admin
    );
  }
}
