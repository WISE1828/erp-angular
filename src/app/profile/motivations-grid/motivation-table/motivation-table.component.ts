import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MotivationsGridState } from '../motivations-grid.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../shared/services/notification.service';
import { MotivationItem, MotivationsGridService } from '../../../shared/services/motivations-grid.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'app-motivation-table',
  templateUrl: './motivation-table.component.html',
  styleUrls: ['./motivation-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // encapsulation: ViewEncapsulation.None,
})
export class MotivationTableComponent implements AfterViewInit {
  displayedColumns: string[] = ['name'];
  dataSource: MatTableDataSource<MotivationItem> = new MatTableDataSource<MotivationItem>([]);
  state = MotivationsGridState.VIEW;
  isLoading = false;

  public form: FormGroup = new FormGroup({
    date: new FormControl(this.motivationsGridService.filterDate, []),
  });

  @Input() set reload(v: boolean) {
    if (v) {
      this.load();
    }
  }
  @Output() onEdit = new EventEmitter();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private motivationsGridService: MotivationsGridService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
  }

  public chosenMonthHandler(normalizedMonth, datepicker): void {
    this.form.get('date').setValue(normalizedMonth);
    datepicker.close();
    const momentDataObject = this.form.get('date').value.toDate();
    const month = momentDataObject.getMonth();
    const year = momentDataObject.getFullYear();
    this.motivationsGridService.filterDate = new Date(year, month, 1);
    this.load();
  }

  load() {
    this.motivationsGridService
      .getItems(this.motivationsGridService.formatedDate)
      .pipe(untilDestroyed(this))
      .subscribe(
        (data: MotivationItem[]) => {
          this.dataSource.data = data;
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  remove(id: number) {
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
      data: {
        title: 'Удаление',
        content: `Вы действительно хотите удалить`,
        itemName: 'элемент',
        confirmButton: 'Удалить',
      },
    });
    confirmDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        if (data) {
          this.isLoading = true;
          this.motivationsGridService
            .removeItem(id)
            .pipe(untilDestroyed(this))
            .subscribe(
              () => {
                this.isLoading = false;
                this.load();
                this.notificationService.showMessage('success', 'Удалено');
                this.cd.detectChanges();
              },
              () => {
                this.isLoading = false;
                this.notificationService.showMessage('error', 'При удалении произошла ошибка');
                this.cd.detectChanges();
              }
            );
        }
        this.cd.detectChanges();
      });
  }
  edit(item: MotivationItem) {
    this.onEdit.emit(item);
  }
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
