import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-blocks-and-themes',
  templateUrl: './blocks-and-themes.component.html',
  styleUrls: ['./blocks-and-themes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksAndThemesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
