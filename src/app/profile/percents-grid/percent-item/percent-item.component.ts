import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../shared/services/notification.service';
import { PercentItem, PercentsGridService, ProfitPercentInfo } from '../../../shared/services/percents-grid.service';
import { mode } from '../../../shared/models/mode';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const customValidators = {
  unique: (field: string): ValidatorFn => {
    return (formArray: FormArray): ValidationErrors => {
      const arr = field ? [...formArray.value].map(el => el[field]) : formArray.value;
      const unique = arr.filter((item, index) => arr.indexOf(item) != index);
      return unique.length ? { unique: true } : null;
    };
  },
  sequence: (field: string): ValidatorFn => {
    return (formArray: FormArray): ValidationErrors => {
      const arr = field ? [...formArray.value].map(el => el[field]) : formArray.value;
      const sequence = [...arr.slice(0, -1)].every((el, i) => arr[i] < arr[i + 1]);
      return !sequence ? { sequence: true } : null;
    };
  },
};

@UntilDestroy()
@Component({
  selector: 'app-percent-item',
  templateUrl: './percent-item.component.html',
  styleUrls: ['./percent-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentItemComponent {
  @ViewChildren('scroller') set itemsElement(v: QueryList<ElementRef>) {
    v?.last?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
  @Input() set item(v: PercentItem) {
    this.mode = v ? mode.EDIT : mode.CREATE;
    this.id = v?.id;
    this.buildForm(v);
  }
  @Output() onClosed = new EventEmitter();

  arrayItems = [];
  form: FormGroup;
  isCreate = false;
  isLoading = false;
  mode = mode.CREATE;
  id: number;
  editingItem = null;

  constructor(
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private percentsGridService: PercentsGridService,
    private cd: ChangeDetectorRef
  ) {}

  buildForm(item: PercentItem = null) {
    this.arrayItems = [];
    this.form = new FormGroup({
      name: new FormControl(item?.name, [Validators.required]),
      profitPercentInfoCollection: new FormArray(
        [],
        [Validators.required, customValidators.unique('percent'), customValidators.sequence('percent')]
      ),
    });
    item?.profitPercentInfoCollection.forEach(el => this.addItem({ ...el, false: false }));
    this.isCreate = false;
    this.isLoading = false;
  }

  get array() {
    return this.form.get('profitPercentInfoCollection') as FormArray;
  }
  getIsEdit(i: number) {
    return this.array.at(i).get('isEdit') as FormControl;
  }
  get isEditing() {
    return this.arrayItems.some(({ isEdit }) => isEdit);
  }

  getProfit(i: number) {
    return this.array.at(i).get('profit') as FormControl;
  }
  getPercent(i: number) {
    return this.array.at(i).get('percent') as FormControl;
  }

  addItem(item: any = { profit: 0, percent: 0, isEdit: true }) {
    this.isCreate = true;
    this.arrayItems.push(item);
    this.array.push(
      new FormGroup({
        profit: new FormControl(item.profit, [Validators.required, Validators.min(0)]),
        percent: new FormControl(item.percent, [Validators.required, Validators.min(1), Validators.max(100)]),
      })
    );
  }
  editItem(index: number, event) {
    this.editingItem = this.arrayItems[index];
    this.arrayItems[index].isEdit = !this.arrayItems[index].isEdit;
    this.isCreate = !this.isCreate;
    event?.stopPropagation();
  }
  removeItem(index: number) {
    this.arrayItems = this.arrayItems.filter((el, i) => i != index);
    this.array.removeAt(index);
    this.isCreate = false;
  }
  declineEditingItem(index, event) {
    this.arrayItems[index] = {
      ...this.editingItem,
      isEdit: false,
    };
    this.array.at(index).patchValue({
      ...this.editingItem,
      isEdit: false,
    });
    this.editingItem = null;
    this.isCreate = false;
    event?.stopPropagation();
  }

  close() {
    this.isCreate = false;
    this.onClosed.emit();
  }
  save() {
    const data: PercentItem = {
      ...this.form.value,
      date: this.percentsGridService.formatedDate,
      profitPercentInfoCollection: this.array.value.map(d => ({ ...d, isEdit: null })),
    };

    this.mode === mode.CREATE
      ? this.percentsGridService
          .addItem(data)
          .pipe(untilDestroyed(this))
          .subscribe(
            ({ name }) => {
              this.close();
              this.notificationService.showMessage('success', `Сетка ${name} успешно создана`);
              this.cd.detectChanges();
            },
            () => {
              this.notificationService.showMessage('error', 'При создании сетки произошла ошибка');
              this.cd.detectChanges();
            }
          )
      : this.percentsGridService
          .updateItem(this.id, data)
          .pipe(untilDestroyed(this))
          .subscribe(
            ({ name }) => {
              this.close();
              this.notificationService.showMessage('success', `Сетка ${name} успешно изменена`);
              this.cd.detectChanges();
            },
            () => {
              this.notificationService.showMessage('error', 'При изменении сетки произошла ошибка');
              this.cd.detectChanges();
            }
          );
  }
}
