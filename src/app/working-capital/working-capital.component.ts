import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-working-capital',
  templateUrl: './working-capital.component.html',
  styleUrls: ['./working-capital.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkingCapitalComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
