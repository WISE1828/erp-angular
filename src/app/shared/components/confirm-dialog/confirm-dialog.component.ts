import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent implements OnInit {
  dialodData: IDialodData;

  constructor(private dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) data) {
    this.dialodData = data;
  }

  ngOnInit(): void {}

  public save(): void {
    this.dialogRef.close(true);
  }

  public close(): void {
    this.dialogRef.close();
  }
}

interface IDialodData {
  title: string;
  content: string;
  confirmButton: string;
  declineButton?: string;
  itemName: string;
}
