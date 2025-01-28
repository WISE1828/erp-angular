import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-fee-item',
  templateUrl: './fee-item.component.html',
  styleUrls: ['./fee-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeItemComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
