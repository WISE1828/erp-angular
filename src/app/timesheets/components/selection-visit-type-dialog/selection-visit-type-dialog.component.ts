import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-selection-visit-type-dialog',
  templateUrl: './selection-visit-type-dialog.component.html',
  styleUrls: ['./selection-visit-type-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionVisitTypeDialogComponent {
  selectedType: FormControl = new FormControl();
  visitTypes = [
    { type: 0, name: 'Выходной' },
    { type: 1, name: 'Присутствие' },
    { type: 2, name: 'Отсутствие' },
    { type: 3, name: 'Опоздание' },
    { type: 4, name: 'Дистанционное присутствие' },
    { type: 5, name: 'Стажировка' },
  ];

  constructor(
    public dialogRef: MatDialogRef<SelectionVisitTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public type: string
  ) {
    this.selectedType.setValue(type);
  }

  changeVisitType() {
    this.dialogRef.close(this.selectedType.value);
  }
}
