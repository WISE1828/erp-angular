import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { newUser, RegistrationService } from '../shared/services/registration.service';
import { AuthService } from '../shared/services/auth.service';
import { AuthValidators } from '../shared/auth.validators';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationComponent implements OnInit {
  isRegistered = false;
  isError = false;
  form: FormGroup;
  errorMessage = '';

  public roles = this.auth.rolesList;

  constructor(
    private registrationService: RegistrationService,
    public auth: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      role: new FormControl(null, [Validators.required]),
      passwords: new FormGroup(
        {
          password: new FormControl(null, [Validators.required, AuthValidators.passwordPattern]),
          repeat: new FormControl(null, [Validators.required]),
        },
        AuthValidators.checkPasswords
      ),
      isRemote: new FormControl(null),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const newUser: newUser = {
      email: this.form.value.email,
      roleId: +this.form.value.role,
      password: this.form.value.passwords.password,
      passwordConfirm: this.form.value.passwords.repeat,
      isRemote: !!this.form.value.isRemote,
    };

    this.registrationService.register(newUser).subscribe(
      () => {
        this.isRegistered = true;
        setTimeout(() => {
          this.isRegistered = false;
          this.cd.detectChanges();
        }, 5000);
        this.form.reset();
        this.cd.detectChanges();
      },
      error => {
        this.isError = true;
        this.errorMessage = /[а-я]/i.test(error?.error || '') ? error?.error : 'Сервисная ошибка';
        this.cd.detectChanges();
        setTimeout(() => {
          this.isError = false;
          this.errorMessage = '';
          this.cd.detectChanges();
        }, 5000);
      }
    );
  }
}
