import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { UserInfoService } from '../shared/services/user-info.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopPanelComponent implements OnInit {
  userId: string;
  public role = +localStorage.getItem('role');

  constructor(
    public authService: AuthService,
    public userInfoService: UserInfoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');
    this.getName(this.userId);
  }

  public get hasAccess(): boolean {
    return [
      this.authService.roles.admin,
      this.authService.roles.bayer,
      this.authService.roles.smart,
      this.authService.roles.helper,
      this.authService.roles.teamlead,
      this.authService.roles.financier,
    ].includes(this.role);
  }

  getName(userId: string): void {
    this.userInfoService
      .getUserInfo(userId)
      .pipe(untilDestroyed(this))
      .subscribe(
        response => {
          this.userInfoService.userFullName = `${response.firstName} ${response.lastName}`;
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
  }
}
