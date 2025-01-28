import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CredentialsInfoService } from '../shared/services/сredentials-info.service';

@Component({
  selector: 'app-passwords',
  templateUrl: './passwords.component.html',
  styleUrls: ['./passwords.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordsComponent implements OnInit {
  public readonly GUIDE_BLOCK_TYPE = '7';

  textData = {
    item: 'пасс',
  };
  actions = {
    list: () => this.credentialsInfoService.list(),
    create: payload => this.credentialsInfoService.create(payload),
    update: (id, payload) => this.credentialsInfoService.update(id, payload),
    delete: id => this.credentialsInfoService.delete(id),
  };

  constructor(private credentialsInfoService: CredentialsInfoService) {}

  ngOnInit(): void {}
}
