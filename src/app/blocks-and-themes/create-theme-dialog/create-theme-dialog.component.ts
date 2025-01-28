import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-theme-dialog',
  templateUrl: './create-theme-dialog.component.html',
  styleUrls: [
    './create-theme-dialog.component.scss',
    '../../shared/components/confirm-dialog/confirm-dialog.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateThemeDialogComponent implements OnInit {
  form: FormGroup;

  constructor(private dialogRef: MatDialogRef<CreateThemeDialogComponent>) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null, [Validators.required]),
    });
  }

  public save(): void {
    this.dialogRef.close(this.form.get('name').value);
  }

  public close(): void {
    this.dialogRef.close();
  }
}
