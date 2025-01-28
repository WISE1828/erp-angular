import { AfterContentChecked, Directive, ElementRef, HostListener, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

type inputType = 'INTEGER' | 'FLOAT';

@Directive({
  selector: '[appNumberInput]',
})
export class NumberInputDirective implements AfterContentChecked {
  @Input() dynamicWidth = false;
  @Input() formControl: FormControl;
  @Input() typeValue: inputType = 'INTEGER';
  @HostListener('input') onInput() {
    const value = this.trimInvalidData(this.el.nativeElement.value);
    if (this.typeValue === 'INTEGER') {
      this.setValue(value);
    }
    this.setWidth();
  }

  constructor(private el: ElementRef) {}

  ngAfterContentChecked() {
    this.setWidth();
  }

  private setValue(value) {
    if (this.formControl) {
      this.formControl.patchValue(value);
    } else {
      this.el.nativeElement.value = value;
    }
  }

  private setWidth() {
    if (this.dynamicWidth) {
      const value = this.el.nativeElement.value;
      this.el.nativeElement.style.width = (value ? (value + '').length : 1) * 10 + 'px';
    }
  }

  private trimInvalidData(v): number | string {
    if (this.typeValue === 'INTEGER') {
      return Number(
        String(v)
          .replace(/\D|(^0)/gi, '')
          .replace(/,/, '')
          .replace(/\./, '')
      );
    }
    return +String(v);
  }
}
