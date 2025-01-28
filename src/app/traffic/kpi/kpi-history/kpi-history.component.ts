import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { KpiComponent } from '../kpi.component';
import { AuthService } from '../../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { TrafficService } from '../../../shared/services/traffic.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AccountRequestService } from '../../../shared/services/account-request.service';
import * as moment from 'moment';
import { FormControl } from '@angular/forms';
import { parseNumberWithPrefix } from '../../../shared/helpers';

@Component({
  selector: 'app-kpi-history',
  templateUrl: './kpi-history.component.html',
  styleUrls: [
    '../../../shared/components/data-table/data-table.component.scss',
    '../../../shared/components/data-table/content/cell-content/cell-content.component.scss',
    './kpi-history.component.scss',
    '../kpi.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiHistoryComponent extends KpiComponent {
  columnsToDisplay = [
    'id',
    'name',
    'geo',
    'advertiser',
    'conditions',
    'offerStatus',
    'isCapClosed',
    'cap',
    'responsible',
    'comment',
    'actions',
  ];
  columnsNames = {
    id: 'ID',
    name: 'Название',
    geo: 'Гео',
    advertiser: 'Рекл',
    conditions: 'Условия',
    offerStatus: 'Статус',
    cap: 'Показатели',
    responsible: 'Ответственный',
    comment: 'Комментарий',
    isCapClosed: 'Состояние',
    actions: '',
  };
  date = new FormControl(moment());

  dateChange() {
    this.loadData();
  }

  constructor(
    auth: AuthService,
    cd: ChangeDetectorRef,
    dialog: MatDialog,
    trafficService: TrafficService,
    notificationService: NotificationService,
    accountRequestService: AccountRequestService,
    ngZone: NgZone
  ) {
    super(auth, cd, dialog, trafficService, notificationService, accountRequestService, ngZone);
  }

  get listSource() {
    const date = moment(this.date.value).format('DD.MM.YYYY');
    if (this.isAdmin) {
      return this.trafficService.getOfferTemplateHistories(date);
    }
    if (this.isTeamLead) {
      return this.trafficService.getTeamTemplateHistories(this.teamId, date);
    }
    return this.trafficService.getUserTemplateHistories(this.userid, date);
  }

  DATA_MAPPED(data) {
    let rowId = 0;
    const mapper = (data, id, actions) => ({
      ...data,
      actions,
      rowId: `row-${rowId++}`,
    });

    if (this.isAdmin) {
      return data.map(el => ({
        ...mapper(el, el.id, true),
        items: el.teamOfferTemplateHistories.map(tel => ({
          ...mapper(tel, tel.teamId, true),
          items: tel.userOfferTemplateHistories.map(uel => ({ ...mapper(uel, uel.userId, undefined) })),
        })),
      }));
    }
    if (this.isTeamLead) {
      return data.map(el => ({
        ...mapper(el, el.id, true),
        items: el.userOfferTemplateHistories.map(uel => ({ ...mapper(uel, uel.userId, undefined) })),
      }));
    }

    return data.map(uel => ({ ...mapper(uel, uel.userId, undefined) }));
  }

  REVERT_DATA_MAPPED(data) {
    if (this.isAdmin) {
      return {
        ...data,
        items: undefined,
        teamOfferTemplateHistories: data?.items?.map(tel => ({
          ...tel,
          items: undefined,
          userOfferTemplateHistories: tel?.items?.map(uel => ({ ...uel, items: undefined })),
        })),
      };
    }
    if (this.isTeamLead) {
      return {
        ...data,
        items: undefined,
        userOfferTemplateHistories: data?.items?.map(tel => ({ ...tel, items: undefined })),
      };
    }

    return data;
  }

  capView(element) {
    return (
      parseNumberWithPrefix(element?.cap, '/ ', 'ru', '1.0-0') +
      parseNumberWithPrefix(element?.conversions, '/ ', 'ru', '1.0-0') +
      parseNumberWithPrefix(element?.approvedLeads, '', 'ru', '1.0-0')
    );
  }

  closedView(element) {
    return element?.isCapClosed ? 'Кап закрыт' : 'Кап не закрыт';
  }
}
