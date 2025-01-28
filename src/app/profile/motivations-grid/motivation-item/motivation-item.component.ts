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
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../shared/services/notification.service';
import { mode } from '../../../shared/models/mode';
import {
  MotivationItem,
  MotivationsGridService,
  QuantityBonusInfo,
} from '../../../shared/services/motivations-grid.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-motivation-item',
  templateUrl: './motivation-item.component.html',
  styleUrls: ['./motivation-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotivationItemComponent {
  @ViewChildren('scroller') set itemsElement(v: QueryList<ElementRef>) {
    v?.last?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
  @Input() set item(v: MotivationItem) {
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
    private motivationsGridService: MotivationsGridService,
    private cd: ChangeDetectorRef
  ) {}

  buildForm(item: MotivationItem = null) {
    this.arrayItems = [];
    this.form = new FormGroup({
      name: new FormControl(item?.name, [Validators.required]),
      quantityName: new FormControl(item?.quantityName || 'Колличество'),
      quantitySign: new FormControl(item?.quantitySign || 'Кол-во'),
      bonusName: new FormControl(item?.bonusName || 'Бонус'),
      bonusSign: new FormControl(item?.bonusSign || 'Б'),
      quantityBonusInfoCollection: new FormArray([], [Validators.required]),
    });
    item?.quantityBonusInfoCollection.forEach(el => this.addItem({ ...el, false: false }));
    this.isCreate = false;
    this.isLoading = false;
  }

  get array() {
    return this.form.get('quantityBonusInfoCollection') as FormArray;
  }
  getBonus(i: number) {
    return this.array.at(i).get('bonus') as FormControl;
  }
  getQuantity(i: number) {
    return this.array.at(i).get('quantity') as FormControl;
  }
  getIsEdit(i: number) {
    return this.array.at(i).get('isEdit') as FormControl;
  }
  isItemValid(i) {
    return this.getBonus(i).valid && this.getQuantity(i).valid;
  }
  get isEditing() {
    return this.arrayItems.some(({ isEdit }) => isEdit);
  }

  addItem(item: QuantityBonusInfo | any = { quantity: 0, bonus: 0, isEdit: true }) {
    this.isCreate = true;
    this.arrayItems.push(item);
    this.array.push(
      new FormGroup({
        quantity: new FormControl(item.quantity, [Validators.required]),
        bonus: new FormControl(item.bonus, [Validators.required]),
      })
    );
    // this.arrayItems = this.arrayItems.sort((a, b) => a.motivation - b.motivation);
    // this.array.patchValue([...this.arrayItems]);
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
    const data: MotivationItem = {
      ...this.form.value,
      date: this.motivationsGridService.formatedDate,
      quantityBonusInfoCollection: this.array.value.map(d => ({ ...d, isEdit: undefined })),
    };

    this.mode === mode.CREATE
      ? this.motivationsGridService
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
      : this.motivationsGridService
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
