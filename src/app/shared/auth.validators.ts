import { FormControl, FormGroup } from '@angular/forms';

export class AuthValidators {
  static passwordPattern(control: FormControl): { [key: string]: boolean } {
    const pattern = RegExp('^(?=^.{6,}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$');
    return pattern.test(control.value) ? null : { passwordPattern: true };
  }

  static checkPasswords(group: FormGroup): { [key: string]: boolean } {
    const pass = group.controls.password.value;
    const confirmPass = group.controls.repeat.value;
    return pass === confirmPass ? null : { notSame: true };
  }
}
