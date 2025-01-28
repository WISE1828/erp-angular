import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-additionaly',
  templateUrl: './additionaly.component.html',
  styleUrls: ['./additionaly.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalyComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
