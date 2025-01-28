import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { isNullOrUndefined } from 'util';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-linear-progress-bar',
  templateUrl: './linear-progress-bar.component.html',
  styleUrls: ['./linear-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LinearProgressBarComponent),
      multi: true,
    },
  ],
})
export class LinearProgressBarComponent {
  onChange: any = () => {};
  onTouch: any = () => {};
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }
  get value() {
    return this.hideValues ? 0 : this._value;
  }
  set value(val) {
    this._value = val;
    this.onChange(val);
    this.onTouch(val);
    this.cd.detectChanges();
  }
  writeValue(value: any): void {
    this.value = value;
  }

  _value: number = 0;

  @Input()
  hideValues = false;

  @Input()
  disabled: boolean = false;

  @Input()
  minValue: number = 0;

  @Input()
  maxValue: number = 0;

  @Input()
  limitValue: number = 0;

  @Input()
  color = '#e3b04e';

  constructor(private cd: ChangeDetectorRef) {}

  checkValue(value) {
    if (value > this.limitValue) {
      this.value = this.limitValue;
      this.cd.detectChanges();
    }
  }

  log(name, e) {
    console.log(name, e);
  }

  get progressValue() {
    let value = Math.round((this.value / this.maxValue) * 100);
    value = isNaN(value) || !isFinite(value) || isNullOrUndefined(value) ? this.minValue : value;
    return value;
  }
}
