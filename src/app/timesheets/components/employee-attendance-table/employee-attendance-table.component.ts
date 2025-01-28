import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { VisitTypesEnum } from '../../enums/visit-types.enum';
import { IVisitLogRow } from '../../interfaces/visit-log-row.interface';
import { IVisitLogCell } from '../../interfaces/visit-log-cell.interface';

import { SelectionVisitTypeDialogComponent } from '../selection-visit-type-dialog/selection-visit-type-dialog.component';
import { isNullOrUndefined } from 'util';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface IRowTable {
  [key: number]: IVisitLogCell | string | number;
}

const filterDays = (visitLogCells: IVisitLogCell[], type: VisitTypesEnum) =>
  visitLogCells?.filter(cell => cell.visitType === type).length;

@UntilDestroy()
@Component({
  selector: 'app-employee-attendance-table',
  templateUrl: './employee-attendance-table.component.html',
  styleUrls: ['./employee-attendance-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendanceTableComponent implements OnDestroy {
  @Input() set setVisitList(visitList: IVisitLogRow[]) {
    if (visitList && visitList.length) {
      this.visitList = visitList;
      this.selectedCell = null;
      this.selectedCellIndex = null;
      this.updateDataTable();
    }
  }
  @Input() isAdmin: boolean = false;
  @Input() isTeamLead: boolean = false;
  @Input() isLoading: boolean = false;

  @Input() maxDays = 31;

  @Output()
  public onUpdateCell = new EventEmitter<{ cell: IVisitLogCell; index: number }>();

  visitList: IVisitLogRow[] = [];
  days: string[] = [];

  columnsTable: string[] = [];
  dataTable: IRowTable[] = [];

  visitTypes = VisitTypesEnum;

  selectedCellIndex: number;
  selectedCell: IVisitLogCell;

  private destroyed$: Subject<void> = new Subject<void>();

  constructor(private dialog: MatDialog) {}

  ngOnDestroy(): void {
    this.destroyed$.complete();
    this.destroyed$.unsubscribe();
  }

  checkAccess(cell: IVisitLogCell & { isActive: boolean }): boolean {
    if (!cell) {
      return false;
    }
    const isDateValid = new Date(cell.date) < new Date();
    return isDateValid && cell.isActive && this.isTeamLead;
  }

  openDialog(cell: IVisitLogCell & { isActive: boolean }, index: number): void {
    const isTeamLeadAccess = this.checkAccess(cell);
    if (isTeamLeadAccess || this.isAdmin) {
      this.selectedCell = cell;
      this.selectedCellIndex = index;
      const dialogRef = this.dialog.open(SelectionVisitTypeDialogComponent, {
        data: cell.visitType,
      });
      this.dialogRefAfterClosed(dialogRef);
    }
  }

  private dialogRefAfterClosed(dialogRef: MatDialogRef<SelectionVisitTypeDialogComponent>): void {
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroyed$),
        filter(d => !isNullOrUndefined(d)),
        untilDestroyed(this)
      )
      .subscribe((type: VisitTypesEnum) =>
        this.onUpdateCell.next({
          cell: {
            ...this.selectedCell,
            visitType: type,
          },
          index: this.selectedCellIndex,
        })
      );
  }

  redrawDays() {
    const columnsBase = ['userName', 'skippedDays', 'incompleteDays', 'warnings'];
    this.days = [];
    for (let i = 1; i < this.maxDays + 1; i++) this.days.push(i.toString());
    this.columnsTable = [...columnsBase.slice(0, 1), ...this.days, ...columnsBase.slice(1, 4)];
  }

  private updateDataTable(): void {
    this.redrawDays();

    this.dataTable = this.visitList.map(visitListItem => {
      const cells: { [key: number]: IVisitLogCell } = {};

      visitListItem?.visitLogCells.forEach((cell, index) => {
        Object.assign(cells, {
          [index]: { ...visitListItem?.visitLogCells[index], isActive: visitListItem.isActive },
        });
      });

      return Object.assign(
        {
          user: visitListItem?.termUserInfo,
          skippedDays: filterDays(visitListItem?.visitLogCells, this.visitTypes.ABSENT),
          incompleteDays: filterDays(visitListItem?.visitLogCells, this.visitTypes.INTERNSHIP),
          warnings: filterDays(visitListItem?.visitLogCells, this.visitTypes.LATE),
        },
        cells
      );
    });
  }
}
