import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-consumables',
  templateUrl: './consumables.component.html',
  styleUrls: ['./consumables.component.scss', '../blocks-and-themes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsumablesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
