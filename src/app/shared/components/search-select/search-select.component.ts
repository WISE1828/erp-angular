import { ChangeDetectionStrategy, Component, forwardRef, Input, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isObject } from 'util';

@Component({
  selector: 'app-search-select',
  templateUrl: './search-select.component.html',
  styleUrls: ['./search-select.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelectComponent),
      multi: true,
    },
  ],
})
export class SearchSelectComponent implements ControlValueAccessor {
  onChange: any = () => {};
  onTouch: any = () => {};
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }

  @Input() set options(v: IOption[]) {
    this.originalOptions = [...v];
    this.filteredOptions = [...v];
  }
  @Input() label: string = '';
  @Input() placeholder = 'Введите текст';
  @Input() isDisabled = false;
  @Input() type = 'text';
  originalOptions: IOption[] = [];
  filteredOptions: IOption[] = [];
  searchItem = null;

  constructor() {}

  setItem(data) {
    const name = isObject(data) ? data?.label : data || '';
    this.filteredOptions = this._filter(name);
  }

  set value(value) {
    this.searchItem = value;
    this.setItem(value);
    this.onChange(value);
    this.onTouch(value);
  }
  writeValue(value: any, isUpdate: boolean = false) {
    this.value = value;
  }

  private _filter(name: string): IOption[] {
    const filterValue = name.toLowerCase();
    return this.originalOptions.filter(option => option.label.toLowerCase().indexOf(filterValue) === 0);
  }
  displayFn(option: IOption): string {
    return option && option.label ? option.label : '';
  }
}

interface IOption {
  label: string;
  value: any;
}
