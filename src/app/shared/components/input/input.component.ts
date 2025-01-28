import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  onChange: any = () => {};
  onTouch: any = () => {};
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }
  get value() {
    return this.val;
  }
  set value(val) {
    this.val = val;
    this.onChange(val);
    this.onTouch(val);
  }
  writeValue(value: any): void {
    this.value = value;
    this.setInitialValue(value);
  }

  @Input() isAccessToEdit = false;
  @Input() prefix = null;
  @Input() postfix = null;
  @Input() isLoading = false;
  @Input() isInvalid = false;
  @Input() isValid = false;
  @Input() isEdit = false;
  @Input() oldValue = null;
  @Input() initialValue = null;
  @Input() typeValue = 'INTEGER';
  @Input() dynamicWidth = true;
  @Input() emptyMessage = 'Не указано';

  @Output() saveEvent = new EventEmitter();
  @Output() closeEvent = new EventEmitter();
  @Output() editEvent = new EventEmitter();
  @Output() isEditing = new EventEmitter();

  val = null;

  save() {
    this.initialValue = null;
    this.isEdit = !this.isEdit;
    this.value = ('' + this.value).replace(/,/g, '.');
    this.value = isFinite(+this.value) ? +this.value : 0;
    this.saveEvent.emit();

    this.isEditing.emit(this.isEdit);
  }
  close() {
    this.value = this.initialValue;
    this.isEdit = !this.isEdit;
    this.closeEvent.emit();

    this.isEditing.emit(this.isEdit);
  }
  edit() {
    this.isEdit = !this.isEdit;
    this.editEvent.emit();

    this.isEditing.emit(this.isEdit);
  }

  setInitialValue(value) {
    if (isNullOrUndefined(value) && isNullOrUndefined(this.initialValue)) {
      this.initialValue = 0;
    }
    if (!isNullOrUndefined(value) && isNullOrUndefined(this.initialValue)) {
      this.initialValue = value;
    }
  }

  get isEmpty() {
    return !this.value && !this.initialValue;
  }
  get isLoadingOrEdit() {
    return this.isLoading || this.isEdit;
  }

  constructor() {}
}
