import { Component, OnInit, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GuideThemeType } from '../../shared/services/blocks-and-themes.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { mode } from '../../shared/models/mode';

@Component({
  selector: 'app-password-create-dialog',
  templateUrl: './password-create-dialog.component.html',
  styleUrls: [
    '../../blocks-and-themes/create-guide-dialog/create-guide-dialog.component.scss',
    '../../shared/components/confirm-dialog/confirm-dialog.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordCreateDialogComponent implements OnInit {
  public fileName: string;
  public loading = false;
  public form: FormGroup;
  public isEdit = false;
  themeType = GuideThemeType;
  isSaved = false;
  isFullSize = false;

  constructor(
    private dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cd: ChangeDetectorRef
  ) {}

  toggleFullSize() {
    this.isFullSize = !this.isFullSize;
    if (this.isFullSize) {
      this.dialogRef.addPanelClass('full-screen-modal');
    } else {
      this.dialogRef.removePanelClass('full-screen-modal');
    }
  }

  ngOnInit(): void {
    this.isEdit = this.data?.mode === mode.EDIT || false;
    const guide = this.data?.guide || { id: 0, name: null, login: null, password: null, url: null };
    this.form = new FormGroup({
      id: new FormControl(guide?.id || 0),
      name: new FormControl(guide.name, [Validators.required]),
      password: new FormControl(guide.password, [Validators.required]),
      login: new FormControl(guide.login, [Validators.required]),
      url: new FormControl(guide.url),
    });
  }

  public save(): void {
    this.isSaved = true;
    this.dialogRef.close({
      id: this.form.get('id').value,
      password: this.form.get('password').value,
      login: this.form.get('login').value,
      name: this.form.get('name').value,
      url: this.form.get('url').value,
    });
  }

  public close(): void {
    this.dialogRef.close();
  }
}
