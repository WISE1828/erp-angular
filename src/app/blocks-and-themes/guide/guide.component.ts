import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { BlocksAndThemesService, GuideThemeType, IGuide } from '../../shared/services/blocks-and-themes.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss', '../blocks-and-themes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideComponent implements OnInit {
  public loading = false;
  public role: number;
  @Input() guide: IGuide;
  @Input() guideThemeType: GuideThemeType;
  @Output() deleteGuideEmitter: EventEmitter<any> = new EventEmitter<any>();
  @Output() editGuideEmitter: EventEmitter<any> = new EventEmitter<any>();
  confirmDialogRef: MatDialogRef<ConfirmDialogComponent>;
  themeType = GuideThemeType;

  constructor(
    private dialog: MatDialog,
    private blocksAndThemesService: BlocksAndThemesService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef,
    public auth: AuthService
  ) {}

  get isAccessToEdit() {
    return [
      this.auth.roles.admin,
      this.auth.roles.techSpecialist,
      this.auth.roles.teamLeadTechnicalSpecialist,
    ].includes(this.role);
  }

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
  }

  public editGuide(): void {
    this.editGuideEmitter.emit(this.guide);
  }

  public deleteGuide(): void {
    this.confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
      data: {
        title: 'Удаление гайда',
        content: `Вы действительно хотите удалить гайд`,
        itemName: this.guide.name,
        confirmButton: 'Удалить',
      },
    });

    this.confirmDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          this.loading = true;
          this.blocksAndThemesService
            .deleteGuide(this.guide.id)
            .pipe(untilDestroyed(this))
            .subscribe(
              () => {
                this.loading = false;
                this.deleteGuideEmitter.emit(this.guide.id);
                this.cd.detectChanges();
              },
              () => {
                this.loading = false;
                this.notificationService.showMessage('error', 'При удалении произошла ошибка');
                this.cd.detectChanges();
              }
            );
        }
        this.cd.detectChanges();
      });
  }
}
