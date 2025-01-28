import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { BlocksAndThemesService, ITheme } from '../../shared/services/blocks-and-themes.service';
import { NotificationService } from '../../shared/services/notification.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateThemeDialogComponent } from '../create-theme-dialog/create-theme-dialog.component';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockComponent implements OnInit {
  @Input() GUIDE_BLOCK_TYPE: string;
  @Input() textData = {
    item: 'гайд',
  };
  @Input() actions: any = {};
  addGuideDialogRef: MatDialogRef<CreateThemeDialogComponent>;
  public loading = true;
  public role: number;
  public themes: ITheme[];

  constructor(
    private blocksAndThemesService: BlocksAndThemesService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    public auth: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  get isAccessToCreate() {
    return [
      this.auth.roles.admin,
      this.auth.roles.teamlead,
      this.auth.roles.techSpecialist,
      this.auth.roles.teamLeadTechnicalSpecialist,
    ].includes(this.role);
  }

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.getThemes();
  }

  getThemes() {
    let action = this.blocksAndThemesService.getThemes(this.GUIDE_BLOCK_TYPE);
    if (this.actions?.list) {
      action = this.actions.list();
    }
    action.pipe(untilDestroyed(this)).subscribe(
      resp => {
        this.themes = resp;
        this.loading = false;
        this.cd.detectChanges();
      },
      () => {
        this.loading = false;
        this.notificationService.showMessage('error', 'При получении данных произошла ошибка');
        this.cd.detectChanges();
      }
    );
  }

  public onThemeDeleting(id: number): void {
    this.themes = this.themes.filter(theme => theme.id !== id);
    this.getThemes();
  }

  public onThemeEditing() {
    this.getThemes();
  }

  public addTheme(): void {
    this.addGuideDialogRef = this.dialog.open(CreateThemeDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
    });

    this.addGuideDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          const theme = {
            id: 0,
            name: data,
            guideTemplates: [],
            guideThemeType: +this.GUIDE_BLOCK_TYPE,
          };

          let action = this.blocksAndThemesService
            .createTheme(theme)
            .pipe(
              map((item: any) => ({ ...item, serviceCredentialsInfoDtos: item?.serviceCredentialsInfoDtos || [] }))
            );

          action.pipe(untilDestroyed(this)).subscribe(
            resp => {
              this.themes.push(resp);
              this.cd.detectChanges();
            },
            () => {
              this.notificationService.showMessage('error', 'Не удалось добавить новую тему');
              this.cd.detectChanges();
            }
          );
        }
        this.cd.detectChanges();
      });
  }
}
