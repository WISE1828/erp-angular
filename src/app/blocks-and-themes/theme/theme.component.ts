import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  BlocksAndThemesService,
  GuideThemeType,
  IGuide,
  ITheme,
} from '../../shared/services/blocks-and-themes.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../shared/services/notification.service';
import { CreateGuideDialogComponent } from '../create-guide-dialog/create-guide-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { mode } from '../../shared/models/mode';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PasswordCreateDialogComponent } from '../../passwords/password-create-dialog/password-create-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss', '../blocks-and-themes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeComponent implements OnInit {
  @Input() theme: ITheme;
  @Input() textData = {
    item: 'гайд',
  };
  @Input() actions: any = {};
  @Output() deleteThemeEmitter: EventEmitter<any> = new EventEmitter();
  @Output() editThemeEmitter: EventEmitter<any> = new EventEmitter();
  confirmDialogRef: MatDialogRef<any>;
  addGuideDialogRef: MatDialogRef<any>;
  public role: number;
  public loading = false;
  constructor(
    private dialog: MatDialog,
    private blocksAndThemesService: BlocksAndThemesService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef,
    public auth: AuthService
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
  }

  public deleteTheme(): void {
    this.confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
      data: {
        title: 'Удаление темы',
        content: `Вы действительно хотите удалить тему`,
        itemName: this.theme.name,
        confirmButton: 'Удалить',
      },
    });

    this.confirmDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          let deleteAction = this.blocksAndThemesService.deleteTheme(this.theme.id);
          deleteAction.pipe(untilDestroyed(this)).subscribe(
            () => {
              this.deleteThemeEmitter.emit(this.theme.id);
              this.cd.detectChanges();
            },
            () => {
              this.notificationService.showMessage('error', 'При удалении произошла ошибка');
              this.cd.detectChanges();
            }
          );
        }
        this.cd.detectChanges();
      });
  }

  public addGuide(): void {
    const component = this.actions.create ? PasswordCreateDialogComponent : CreateGuideDialogComponent;
    this.addGuideDialogRef = this.dialog.open(component as any, {
      autoFocus: false,
      hasBackdrop: true,
      width: this.theme.guideThemeType === GuideThemeType.Manuals && '90vw',
      data: {
        guideThemeId: this.theme.id,
        guideThemeType: this.theme.guideThemeType,
      },
    });

    this.addGuideDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          this.loading = true;

          let createAction = this.blocksAndThemesService.loadImg(data.pictureLink).pipe(
            switchMap(link => {
              const guide = Object.assign(data, {
                guideThemeId: this.theme.id,
                pictureLink: link,
              });
              return this.blocksAndThemesService.addGuide(guide);
            }),
            untilDestroyed(this)
          );
          if (this.actions.create) {
            data = { ...data, guideThemeId: this.theme.id };
            createAction = this.actions.create(data);
          }

          createAction.subscribe(
            guide => {
              this.loading = false;
              this.themesItems.push(guide);
              this.cd.detectChanges();
            },
            () => {
              this.loading = false;
              this.notificationService.showMessage('error', 'Не удалось добавить новый гайд');
              this.cd.detectChanges();
            }
          );
        }
        this.cd.detectChanges();
      });
  }

  get themesItems(): any[] {
    return this.theme[this.actions.delete ? 'serviceCredentialsInfoDtos' : 'guideTemplates'] || [];
  }
  set themesItems(val: any[]) {
    this.theme[this.actions.delete ? 'serviceCredentialsInfoDtos' : 'guideTemplates'] = val;
  }

  public deleteGuide(id: number): void {
    if (this.actions.delete) {
      this.loading = true;
      this.actions
        .delete(id)
        .pipe(untilDestroyed(this))
        .subscribe(
          () => {
            this.loading = false;
            this.notificationService.showMessage('success', 'Пасс успешно удален');
            this.editThemeEmitter.emit();
            this.cd.detectChanges();
          },
          () => {
            this.loading = false;
            this.notificationService.showMessage('error', 'Не удалось удалить пасс');
            this.cd.detectChanges();
          }
        );
      return;
    }
    this.themesItems = this.themesItems.filter(guide => {
      return guide.id !== id;
    });
  }

  public editGuide(guide: IGuide): void {
    if (this.actions.update) {
      this.loading = true;
      this.actions
        .update(guide.id, { ...guide, guideThemeId: this.theme.id })
        .pipe(untilDestroyed(this))
        .subscribe(
          () => {
            this.loading = false;
            this.notificationService.showMessage('success', 'Пасс успешно изменен');
            this.editThemeEmitter.emit();
            this.cd.detectChanges();
          },
          () => {
            this.loading = false;
            this.notificationService.showMessage('error', 'Не удалось изменить пасс');
            this.cd.detectChanges();
          }
        );
      return;
    }

    const oldPictureLink = guide.pictureLink || '';
    const dialogRef = this.dialog.open(CreateGuideDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
      width: this.theme.guideThemeType === GuideThemeType.Manuals && '90vw',
      data: {
        mode: mode.EDIT,
        guide,
        guideThemeId: this.theme.id,
        guideThemeType: this.theme.guideThemeType,
      },
    });
    const guideOldIndex = this.themesItems.findIndex(el => el.id === guide.id);
    const guideOld = this.themesItems[guideOldIndex];
    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          this.loading = true;
          const action =
            data.pictureLink && data.pictureLink != oldPictureLink
              ? this.blocksAndThemesService.loadImg(data.pictureLink).pipe(
                  switchMap(link => {
                    const guide = Object.assign(data, {
                      guideThemeId: this.theme.id,
                      pictureLink: link,
                    });
                    return this.blocksAndThemesService.editGuide(guide.id, guide);
                  })
                )
              : this.blocksAndThemesService.editGuide(guide.id, {
                  ...data,
                  guideThemeId: this.theme.id,
                  pictureLink: guideOld?.pictureLink || '',
                });
          action.pipe(untilDestroyed(this)).subscribe(
            () => {
              this.loading = false;
              this.notificationService.showMessage('success', 'Гайд успешно изменен');
              this.editThemeEmitter.emit();
              localStorage.removeItem('lastHTMLManual');
              this.cd.detectChanges();
            },
            () => {
              this.loading = false;
              this.notificationService.showMessage('error', 'Не удалось изменить гайд');
              this.cd.detectChanges();
            }
          );
        }
      });
  }
}
