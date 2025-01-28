import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-circle-progress-bar',
  templateUrl: './circle-progress-bar.component.html',
  styleUrls: ['./circle-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircleProgressBarComponent {
  @Input()
  title: string = '';

  @Input()
  value: any;

  @Input()
  postfix: string;

  @Input()
  maxValue: number = 100;

  @Input()
  maxFill: boolean = false;

  @Input()
  minValue: number = 0;

  @Input()
  color = '#e3b04e';

  get progressValue() {
    let value = Math.ceil((this.value / this.maxValue) * 100);
    value = isNaN(value) || !isFinite(value) || isNullOrUndefined(value) ? this.minValue : value;
    return value;
  }
}
