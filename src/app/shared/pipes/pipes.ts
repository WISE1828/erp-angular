import { Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, skip, skipWhile } from 'rxjs/operators';
import { NgModel } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[ngModelChangeDebounced]',
})
export class NgModelChangeDebouncedDirective implements OnDestroy {
  @Output()
  ngModelChangeDebounced = new EventEmitter<any>();
  @Input()
  ngModelChangeDebounceTime = 500; // optional, 500 default

  subscription: Subscription;
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  constructor(private ngModel: NgModel) {
    this.subscription = this.ngModel.valueChanges
      .pipe(
        skipWhile(() => this.ngModel.control.pristine), // skip initial value
        distinctUntilChanged(),
        debounceTime(this.ngModelChangeDebounceTime)
      )
      .subscribe(value => this.ngModelChangeDebounced.emit(value));
  }
}

@Directive({
  selector: '[appFocus]',
})
export class FocusDirective {
  @Input('appFocus')
  private set focused(value: boolean) {
    this.focusSet.emit();
    value &&
      setTimeout(() => {
        this.element.nativeElement.focus();
      }, 0);
  }
  @Output() focusSet = new EventEmitter();

  constructor(public element: ElementRef<HTMLElement>) {}
}
