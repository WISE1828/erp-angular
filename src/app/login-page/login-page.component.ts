import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../shared/services/auth.service';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  form: FormGroup;
  isError = false;
  isAccountBlocked = false;

  constructor(private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.logout();
    this.form = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required]),
    });
  }

  submit(): void {
    this.isAccountBlocked = false;

    if (this.form.invalid) {
      return;
    }

    const user: User = {
      email: this.form.value.email,
      password: this.form.value.password,
    };

    this.auth
      .login(user)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          const userId = localStorage.getItem('userId');
          this.form.reset();
          this.router.navigate(['/profile', userId]);
          this.cd.detectChanges();
        },
        ({ error }) => {
          if (error?.includes('Account is blocked')) {
            this.isAccountBlocked = true;
          }
          this.isError = true;
          this.cd.detectChanges();
        }
      );
  }
}
