import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthValidators } from '../../shared/auth.validators';

interface IDialogData {
  userId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent implements OnInit {
  dialogData: IDialogData;
  hideOriginal = true;
  hideCopy = true;
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {
    this.dialogData = data;
  }

  ngOnInit() {
    this.form = new FormGroup(
      {
        password: new FormControl(null, [Validators.required, AuthValidators.passwordPattern]),
        repeat: new FormControl(null, [Validators.required]),
      },
      AuthValidators.checkPasswords
    );
    this.form.updateValueAndValidity();
  }

  changePassword(): void {
    this.authService
      .changePassword(this.dialogData.userId, this.form.get('password').value)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.notificationService.showMessage('success', 'Пароль успешно изменен');
          this.dialogRef.close();
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'При изменении пароля произошла ошибка');
          this.dialogRef.close();
          this.cd.detectChanges();
        }
      );
  }
}
