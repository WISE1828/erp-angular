import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mode } from '../../shared/models/mode';
import { GuideThemeType } from '../../shared/services/blocks-and-themes.service';

@Component({
  selector: 'app-create-guide-dialog',
  templateUrl: './create-guide-dialog.component.html',
  styleUrls: [
    './create-guide-dialog.component.scss',
    '../../shared/components/confirm-dialog/confirm-dialog.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateGuideDialogComponent implements OnInit {
  public imgPreview: any;
  public fileName: string;
  public loading = false;
  private formData: FormData;
  public form: FormGroup;
  public isEdit = false;
  themeType = GuideThemeType;
  isSaved = false;
  isFullSize = false;

  constructor(
    private dialogRef: MatDialogRef<CreateGuideDialogComponent>,
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
    const guide = this.data?.guide || { id: 0, name: null, meta: null, pictureLink: null };
    this.imgPreview = guide.pictureLink;
    this.form = new FormGroup({
      id: new FormControl(guide?.id || 0),
      name: new FormControl(guide.name, [Validators.required]),
      link: new FormControl(guide.meta, [Validators.required]),
    });
  }

  public save(): void {
    this.isSaved = true;
    this.dialogRef.close({
      meta: this.form.get('link').value,
      name: this.form.get('name').value,
      pictureLink: this.formData || null,
      id: this.form.get('id').value,
    });
  }

  public close(): void {
    this.dialogRef.close();
  }

  public browse(e): void {
    const file = e.target?.files[0] || e.dataTransfer?.files[0];
    this.fileName = file?.name;
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        this.imgPreview = event.target.result;
        this.cd.detectChanges();
      };
      reader.readAsDataURL(e.target?.files[0]);
    } else {
      this.imgPreview = '';
    }
    this.formData = new FormData();
    this.formData.append('reqFile', file);
    this.cd.detectChanges();
  }
}
