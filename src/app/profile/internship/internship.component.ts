import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UserInfoService } from '../../shared/services/user-info.service';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-internship',
  templateUrl: './internship.component.html',
  styleUrls: ['./internship.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternshipComponent {
  @Input() isEditable: boolean;
  @Input() id: number;
  @Input() set value(value: number) {
    this.formControl.patchValue(value);
  }
  valueSnapshot;
  isEdit;
  isLoading;
  formControl = this.fb.control(null, [Validators.min(0), Validators.pattern('^\\d*$')]);

  constructor(
    private userInfoService: UserInfoService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  save() {
    this.isEdit = false;
    if (!this.isEditable || !this.id) {
      this.notificationService.showMessage('error', 'Доступ запрещен!');
      return;
    }

    this.isLoading = true;
    this.userInfoService
      .updateInternshipDays(this.id, this.days || 0)
      .pipe(
        tap(() => this.notificationService.showMessage('success', 'Кол-во дней стажировки изменено.')),
        catchError(err => {
          this.notificationService.showMessage('error', 'При изменении кол-ва дней стажировки, произошла ошибка.');
          this.isLoading = false;
          this.cd.detectChanges();
          this.cancel();
          throw err;
        }),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      });
  }
  edit() {
    this.isEdit = true;
    this.valueSnapshot = this.days;
  }
  cancel() {
    this.isEdit = false;
    this.days = this.valueSnapshot;
    this.valueSnapshot = null;
  }

  get days() {
    return +this.formControl.value;
  }
  set days(days: number) {
    this.formControl.patchValue(days);
  }
}
