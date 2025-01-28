import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit, ViewChildren } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import * as _ from 'lodash';
import { cloneDeep, uniq } from 'lodash';
import { KpiCreateDialogComponent } from './kpi-create-dialog/kpi-create-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AccountRequestService } from '../../shared/services/account-request.service';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';
import { isNullOrUndefined } from 'util';
import { TrafficService } from '../../shared/services/traffic.service';
import { NotificationService } from '../../shared/services/notification.service';
import { debounceTime, filter } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '../../shared/services/auth.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatExpansionPanel } from '@angular/material/expansion';
import { fromEvent } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  styleUrls: [
    '../../shared/components/data-table/data-table.component.scss',
    '../../shared/components/data-table/content/cell-content/cell-content.component.scss',
    './kpi.component.scss',
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiComponent implements OnInit {
  @ViewChildren('headerCellElement') set load(data) {
    this.calcWidth();
  }

  dataSource = new MatTableDataSource([]);
  originalData = [];
  columnsToDisplay = [
    'id',
    'name',
    'geo',
    'advertiser',
    'conditions',
    'offerStatus',
    'cap',
    'responsible',
    'comment',
    'actions',
  ];
  editedColumns = ['cap', 'comment'];
  get editedFirstColumns() {
    if (this.isAdmin) {
      return ['name', 'geo', 'advertiser', 'conditions', 'offerStatus', 'cap', 'comment'];
    }
    return this.editedColumns;
  }
  columnsNames = {
    id: 'ID',
    name: 'Название',
    geo: 'Гео',
    advertiser: 'Рекл',
    conditions: 'Условия',
    offerStatus: 'Статус',
    cap: 'Кап',
    responsible: 'Ответственный',
    comment: 'Комментарий',
    actions: '',
  };
  selectedRow;
  selectedRowOriginal;
  isRendered = false;

  expanded = [];
  expandToggle(id, lvl) {
    if (this.isExpanded(id)) {
      if (lvl === 1) {
        this.expanded = [];
      }
      if (lvl === 2) {
        this.expanded.splice(1, 1);
        this.isRendered = true;
      }
      if (lvl === 3) {
        this.expanded.splice(2, 1);
      }
    } else {
      this.expanded[lvl - 1] = id;
    }

    this.cd.detectChanges();
  }

  widthColumns = {};

  calcWidth() {
    const getWidth = name => {
      const width = document.querySelector(`.cdk-column-${name}`)?.clientWidth;
      return width ? width + 'px' : '';
    };
    this.widthColumns = this.columnsToDisplay.reduce((acc, key) => {
      acc = { ...acc, [key]: getWidth(key) };
      return acc;
    }, {});
    this.cd.detectChanges();
  }

  isExpanded(id, panel?: MatExpansionPanel) {
    const expanded = this.expanded.indexOf(id) != -1;
    if (expanded && panel && !panel?.expanded) {
      console.log('ok');
      panel.open();
    }
    return expanded;
  }

  geoList = [];
  statusList = [
    { id: null, label: 'Не выбрано' },
    { id: StatusOffer.IN_PROGRESS, label: 'В работе' },
    { id: StatusOffer.TEST, label: 'Тест' },
    { id: StatusOffer.CLOSED, label: 'Не в работе' },
  ];
  public role = +localStorage.getItem('role');
  teamId = +localStorage.getItem('teamId');
  userid = +localStorage.getItem('userId');

  status = null;
  filterStatus = data => {
    const status = this.filters.status;
    const filterFn = el => isNullOrUndefined(status) || el?.offerStatus === status;

    if (this.isAdmin) {
      return data
        .map(el => ({
          ...el,
          items: el?.items?.filter(filterFn).map(tel => ({
            ...tel,
            items: tel?.items?.filter(filterFn),
          })),
          teamOfferTemplates: el?.teamOfferTemplates?.filter(filterFn).map(tel => ({
            ...tel,
            userOfferTemplates: tel?.userOfferTemplates?.filter(filterFn),
          })),
        }))
        .filter(filterFn);
    }
    if (this.isTeamLead) {
      return data
        .map(el => ({
          ...el,
          items: el?.items?.filter(filterFn),
          userOfferTemplates: el?.userOfferTemplates?.filter(filterFn),
        }))
        .filter(filterFn);
    }

    return data.filter(filterFn);
  };

  teamList = [];
  team = null;
  filterTeam = data => {
    const teamId = this.filters.team;
    const filterFn = el => isNullOrUndefined(teamId) || el?.teamId === teamId;
    return data.map(el => ({
      ...el,
      items: el?.items?.filter(filterFn),
      teamOfferTemplates: el?.teamOfferTemplates?.filter(filterFn),
    }));
  };
  loading = false;

  filters = {
    team: null,
    status: null,
  };
  applyFilters = (type?, value?) => {
    this.loading = true;
    if (type) {
      this.filters[type] = value;
    }
    let preparedData = this.originalData;

    if (isNotNullOrUndefined(this.filters.status)) {
      preparedData = this.filterStatus(preparedData);
    }
    if (isNotNullOrUndefined(this.filters.team)) {
      preparedData = this.filterTeam(preparedData);
    }
    setTimeout(() => {
      if (!_.isEqual(preparedData, this.dataSource.data)) {
        preparedData = this.sortByStatus(preparedData);
        this.dataSource = new MatTableDataSource(preparedData);
      }
      this.loading = false;
      this.cd.detectChanges();
    }, 150);
  };

  sortByStatus(data) {
    const priority = {
      [StatusOffer.IN_PROGRESS]: 1,
      [StatusOffer.TEST]: 2,
      [StatusOffer.CLOSED]: 3,
      [StatusOffer.NONE]: 4,
    };
    const dataWithPriority = cloneDeep(data);

    const sortFn = (a, b) => priority[a.offerStatus] - priority[b.offerStatus];

    if (this.isAdmin) {
      dataWithPriority.sort(sortFn);
      dataWithPriority.forEach(({ items }) => {
        items.sort(sortFn);
        items.forEach(({ items }) => items.sort(sortFn));
      });
    }
    if (this.isTeamLead) {
      dataWithPriority.forEach(({ items }) => items.sort(sortFn));
    }

    return dataWithPriority;
  }

  get isTeamLead() {
    return [this.auth.roles.teamlead].includes(this.role);
  }

  get isAdmin() {
    return [this.auth.roles.admin].includes(this.role);
  }

  access = {
    first: {
      edit: this.isAdmin,
      expand: this.isAdmin || this.isTeamLead,
    },
    two: {
      edit: this.isAdmin || this.isTeamLead,
      expand: this.isAdmin || this.isTeamLead,
    },
    three: {
      edit: this.isAdmin,
      expand: this.isAdmin,
    },
  };

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    public trafficService: TrafficService,
    private notificationService: NotificationService,
    private accountRequestService: AccountRequestService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    fromEvent(window, 'resize')
      .pipe(untilDestroyed(this), debounceTime(500))
      .subscribe(() => {
        this.calcWidth();
      });
    this.loading = true;
    this.accountRequestService.storedData.pipe(untilDestroyed(this)).subscribe(() => {
      this.loadData();
      this.geoList = this.accountRequestService.countriesList.getValue().map(el => ({
        id: el.id,
        label: el?.shortName,
        code: el?.iso_code3 || el['isO_Code3'],
      }));
      this.geoList.unshift({ id: null, label: 'Не выбрано', code: '' });
    });
  }

  trackByIdentity = (index: number, item: any) => item?.rowId;

  get listSource() {
    if (this.isAdmin) {
      return this.trafficService.getOfferTemplates();
    }
    if (this.isTeamLead) {
      return this.trafficService.getTeamOfferTemplates(this.teamId);
    }
    return this.trafficService.getUserOfferTemplates(this.userid);
  }

  updateSource(id, item) {
    if (this.isAdmin) {
      if (this.selectedRow?.teamOfferTemplates) {
        return this.trafficService.updateOfferTemplates(id, item);
      }
      item = this.selectedRow;
      if (this.selectedRow?.userOfferTemplates) {
        return this.trafficService.updateTeamOfferTemplates(item?.id, { cap: item?.cap, comment: item?.comment });
      }
      return this.trafficService.updateUserOfferTemplates(item?.id, { cap: item?.cap, comment: item?.comment });
    }
    item = this.selectedRow;
    if (this.isTeamLead) {
      return this.trafficService.updateUserOfferTemplates(item?.id, { cap: item?.cap, comment: item?.comment });
    }
    return this.trafficService.updateUserOfferTemplates(id, { cap: item?.cap, comment: item?.comment });
  }

  updData(data) {
    const preparedData = this.sortByStatus(this.DATA_MAPPED(data));
    this.dataSource = new MatTableDataSource(preparedData);
    this.originalData = cloneDeep(this.dataSource.data);
    this.teamList = uniq(
      this.dataSource.data.reduce((acc, el) => {
        acc = acc.concat(el?.items?.map(it => it?.teamId));
        return acc;
      }, [])
    ).map(el => ({ id: el, label: el }));
    this.teamList.unshift({ id: null, label: 'Не выбрано' });
    this.loading = false;
    this.applyFilters();
    this.cd.detectChanges();
  }

  loadData() {
    this.loading = true;
    this.listSource.pipe(untilDestroyed(this)).subscribe(
      data => {
        this.updData(data);
      },
      () => {
        this.notificationService.showMessage('error', 'Данные не найдены');
        this.loading = false;
        this.cd.detectChanges();
      }
    );
  }

  editRow(row) {
    if (this.selectedRow) {
      return;
    }
    this.selectedRow = { ...row };
    this.selectedRowOriginal = { ...row };
    this.cd.detectChanges();
  }

  get selectedRowId() {
    return this.selectedRow?.rowId;
  }

  statusText(state) {
    if (state === StatusOffer.NONE) {
      return '—';
    }
    if (state === StatusOffer.IN_PROGRESS) {
      return 'В работе';
    }
    if (state === StatusOffer.TEST) {
      return 'Тест';
    }
    if (state === StatusOffer.CLOSED) {
      return 'Не в работе';
    }
  }

  statusState(state) {
    if (state === StatusOffer.NONE) {
      return 'status_NONE';
    }
    if (state === StatusOffer.IN_PROGRESS) {
      return 'status_IN_PROGRESS';
    }
    if (state === StatusOffer.TEST) {
      return 'status_TEST';
    }
    if (state === StatusOffer.CLOSED) {
      return 'status_CLOSED';
    }
  }

  getChanges() {
    const changes = cloneDeep(this.selectedRow);
    const getObjById = (item, id) => {
      return item.find(el => {
        return (
          el?.rowId === id ||
          el?.items?.find(tel => {
            return tel?.rowId === id || tel?.items?.find(uel => uel?.rowId === id);
          })
        );
      });
    };

    let data = cloneDeep(this.dataSource.data);
    const replacer = () => {
      const mapper = (item, indexes) => {
        if (item?.rowId === changes?.rowId) {
          const [i, j, k] = indexes;
          if (indexes.length === 1) {
            data[i] = changes;
          }
          if (indexes.length === 2) {
            data[i].items[j] = changes;
          }
          if (indexes.length === 3) {
            data[i].items[j].items[k] = changes;
          }
        }
        return item;
      };
      data.forEach((el, i) => ({
        ...mapper(el, [i]),
        items: el?.items?.forEach((tel, j) => ({
          ...mapper(tel, [i, j]),
          items: tel?.items?.forEach((uel, k) => ({
            ...mapper(uel, [i, j, k]),
          })),
        })),
      }));
      return data;
    };
    data = replacer();
    const mapperResult = el => ({ ...el, rowId: undefined, actions: undefined });
    let item = getObjById(data, this.selectedRow?.rowId);
    item = {
      ...mapperResult(item),
      items: item?.items?.map(tEl => ({
        ...mapperResult(tEl),
        items: tEl?.items?.map(uEl => ({ ...mapperResult(uEl) })),
      })),
    };
    return item;
  }

  saveRow() {
    const item = this.REVERT_DATA_MAPPED(this.getChanges());

    this.loading = true;
    this.cd.detectChanges();

    const clear = () => {
      this.selectedRow = undefined;
      this.selectedRowOriginal = undefined;
      this.cd.detectChanges();
    };

    this.updateSource(item.id, item)
      .pipe(untilDestroyed(this))
      .subscribe(
        data => {
          this.loadData();
          // const dataSource = cloneDeep(this.dataSource.data);
          // const index = _.findIndex(dataSource, { id: item.id });
          // dataSource.splice(index, 1, item);
          // this.updData(dataSource);
          clear();
          this.loading = false;
          this.cd.detectChanges();
          this.notificationService.showMessage('success', 'Данные сохранены');
        },
        () => {
          this.notificationService.showMessage('error', 'При сохранении произошла ошибка');
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }

  totalCap() {
    let changes = this.getChanges();
    changes = this.REVERT_DATA_MAPPED(changes);
    if (this.isAdmin) {
      if (this.selectedRow?.teamOfferTemplates) {
        return 0;
      }
      if (this.selectedRow?.userOfferTemplates) {
        return changes?.teamOfferTemplates?.reduce((acc, cur) => acc + cur?.cap, 0) || 0;
      }
      const users =
        _.find(changes.teamOfferTemplates, el => {
          return el.userOfferTemplates.find(uel => uel?.userId === this.selectedRow?.userId);
        })?.userOfferTemplates || [];
      return users?.reduce((acc, cur) => acc + cur?.cap, 0) || 0;
    }
    if (this.isTeamLead) {
      return changes?.userOfferTemplates?.reduce((acc, cur) => acc + cur?.cap, 0) || 0;
    }
    return 0;
  }

  cancelRow(element) {
    let data = this.dataSource.data;
    const replacer = () => {
      const mapper = (item, indexes) => {
        if (item === element) {
          const [i, j, k] = indexes;
          if (indexes.length === 1) {
            this.dataSource.data[i] = this.selectedRowOriginal;
          }
          if (indexes.length === 2) {
            this.dataSource.data[i].items[j] = this.selectedRowOriginal;
          }
          if (indexes.length === 3) {
            this.dataSource.data[i].items[j].items[k] = this.selectedRowOriginal;
          }
        }
        return item;
      };
      return data.forEach((el, i) => ({
        ...mapper(el, [i]),
        items: el?.items?.forEach((tel, j) => ({
          ...mapper(tel, [i, j]),
          items: tel?.items?.forEach((uel, k) => ({
            ...mapper(uel, [i, j, k]),
          })),
        })),
      }));
    };

    replacer();
    this.selectedRow = undefined;
    this.selectedRowOriginal = undefined;
    this.cd.detectChanges();
  }

  create() {
    const dialog = this.dialog.open(KpiCreateDialogComponent, { width: '245px' });
    dialog
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.loadData();
        this.cd.detectChanges();
      });
  }

  isInvalidCap(maxCap, column) {
    const total = this.totalCap();
    const cur = this.selectedRow?.cap || 0;
    return maxCap != undefined && cur > 0 && maxCap < total && column === 'cap';
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
        items: el.teamOfferTemplates.map(tel => ({
          ...mapper(tel, tel.teamId, true),
          items: tel.userOfferTemplates.map(uel => ({ ...mapper(uel, uel.userId, undefined) })),
        })),
      }));
    }
    if (this.isTeamLead) {
      return data.map(el => ({
        ...mapper(el, el.id, true),
        items: el.userOfferTemplates.map(uel => ({ ...mapper(uel, uel.userId, undefined) })),
      }));
    }

    return data.map(uel => ({ ...mapper(uel, uel.userId, undefined) }));
  }

  REVERT_DATA_MAPPED(data) {
    if (this.isAdmin) {
      return {
        ...data,
        items: undefined,
        teamOfferTemplates: data?.items?.map(tel => ({
          ...tel,
          items: undefined,
          userOfferTemplates: tel?.items?.map(uel => ({ ...uel, items: undefined })),
        })),
      };
    }
    if (this.isTeamLead) {
      return {
        ...data,
        items: undefined,
        userOfferTemplates: data?.items?.map(tel => ({ ...tel, items: undefined })),
      };
    }

    return data;
  }
}

export enum StatusOffer {
  NONE = 0,
  IN_PROGRESS = 1,
  TEST = 2,
  CLOSED = 3,
}
interface BaseKpi {
  id: number;
  name: string;
  geo: string;
  advertiser: string;
  conditions: string;
  offerStatus: StatusOffer;
  comment: string;
  cap: number;
}
export interface UserKpi extends BaseKpi {
  responsible: string;
  userId: number;
}
export interface TeamKpi extends BaseKpi {
  responsible: string;
  teamId: number;
  userOfferTemplates: UserKpi[];
}
export interface CampaignKpi extends BaseKpi {
  teamOfferTemplates: TeamKpi[];
}

const MOCK_DATA: CampaignKpi[] = [
  {
    id: 1,
    name: 'OfferTemp1',
    geo: 'RU',
    advertiser: 'Shakes',
    conditions: 'stringA',
    offerStatus: 2,
    comment: 'string2',
    cap: 220,
    teamOfferTemplates: [
      {
        id: 1,
        geo: 'RU',
        name: 'Команда 1',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'QQQ',
        cap: 10,
        responsible: 'Мистер Пропер',
        teamId: 1,
        userOfferTemplates: [
          {
            id: 1,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Мистер Пропер',
            userId: 2,
          },
          {
            id: 2,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Дональд Дак',
            userId: 13,
          },
          {
            id: 3,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Спуди Мум',
            userId: 17,
          },
          {
            id: 4,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ЛехаТесть',
            userId: 20,
          },
          {
            id: 5,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ПокаТаксистНоВПланахБизнес',
            userId: 24,
          },
          {
            id: 6,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Барсеточник',
            userId: 30,
          },
          {
            id: 7,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Шурик',
            userId: 47,
          },
          {
            id: 8,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Дуримар',
            userId: 57,
          },
          {
            id: 9,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Вован Шило',
            userId: 73,
          },
        ],
      },
      {
        id: 2,
        geo: 'RU',
        name: 'Команда 2',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Йоринобу Арасака',
        teamId: 2,
        userOfferTemplates: [
          {
            id: 10,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Йоринобу Арасака',
            userId: 3,
          },
          {
            id: 11,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Сопливый Актер',
            userId: 6,
          },
          {
            id: 12,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Бамбл Бизи',
            userId: 14,
          },
          {
            id: 13,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'МишкаСват',
            userId: 21,
          },
          {
            id: 14,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ТаксистИзУбера',
            userId: 26,
          },
          {
            id: 15,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гаврик',
            userId: 83,
          },
        ],
      },
      {
        id: 3,
        geo: 'RU',
        name: 'Команда 3',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Подъездный Байден',
        teamId: 3,
        userOfferTemplates: [
          {
            id: 16,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Подъездный Байден',
            userId: 4,
          },
          {
            id: 17,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Веном',
            userId: 16,
          },
          {
            id: 18,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Мистер Хайд',
            userId: 18,
          },
          {
            id: 19,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Шерлок Холмс',
            userId: 19,
          },
          {
            id: 20,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'СоседСМоейПятины',
            userId: 22,
          },
          {
            id: 21,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'МиллионерИзNL',
            userId: 23,
          },
          {
            id: 22,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ТаксистИзДиди',
            userId: 25,
          },
          {
            id: 23,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Саске',
            userId: 40,
          },
          {
            id: 24,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Наруто',
            userId: 41,
          },
          {
            id: 25,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Димас',
            userId: 78,
          },
          {
            id: 26,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Леха',
            userId: 81,
          },
          {
            id: 27,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Максик',
            userId: 85,
          },
        ],
      },
      {
        id: 4,
        geo: 'RU',
        name: 'Команда 4',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Продавец Анальных Смазок',
        teamId: 4,
        userOfferTemplates: [
          {
            id: 28,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Продавец Анальных Смазок',
            userId: 7,
          },
          {
            id: 29,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Олег Князь',
            userId: 72,
          },
        ],
      },
      {
        id: 5,
        geo: 'RU',
        name: 'Команда 5',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'ВодочкиНамПриноситель',
        teamId: 5,
        userOfferTemplates: [
          {
            id: 30,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ВодочкиНамПриноситель',
            userId: 9,
          },
          {
            id: 31,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Продавец Шаурмы',
            userId: 31,
          },
          {
            id: 32,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'БратишкаFromGreenElephant',
            userId: 43,
          },
          {
            id: 33,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Мой кореш',
            userId: 46,
          },
          {
            id: 34,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Ван Хельсинг',
            userId: 62,
          },
          {
            id: 35,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гимли',
            userId: 68,
          },
        ],
      },
      {
        id: 6,
        geo: 'RU',
        name: 'Команда 6',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Интердево4ка',
        teamId: 6,
        userOfferTemplates: [
          {
            id: 36,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Брат Путина',
            userId: 5,
          },
          {
            id: 37,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Пидор Из Химок',
            userId: 8,
          },
          {
            id: 38,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Интердево4ка',
            userId: 11,
          },
          {
            id: 39,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Глад Валакас',
            userId: 33,
          },
          {
            id: 40,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Дамблдор',
            userId: 34,
          },
          {
            id: 41,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гермиона',
            userId: 35,
          },
          {
            id: 42,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Рон',
            userId: 37,
          },
          {
            id: 43,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гарри',
            userId: 39,
          },
          {
            id: 44,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Конфето4ка',
            userId: 48,
          },
          {
            id: 45,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Саня_АК-47',
            userId: 50,
          },
          {
            id: 46,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Жека_228',
            userId: 52,
          },
          {
            id: 47,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Саурон',
            userId: 53,
          },
          {
            id: 48,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Леголас',
            userId: 64,
          },
          {
            id: 49,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гендальф',
            userId: 69,
          },
        ],
      },
      {
        id: 7,
        geo: 'RU',
        name: 'Команда 7',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: '',
        teamId: 7,
        userOfferTemplates: [
          {
            id: 50,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Admin',
            userId: 1,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'OfferTemp2',
    geo: 'RU',
    advertiser: 'Shakes',
    conditions: 'stringA',
    offerStatus: 2,
    comment: 'string2',
    cap: 220,
    teamOfferTemplates: [
      {
        id: 8,
        geo: 'RU',
        name: 'Команда 1',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Мистер Пропер',
        teamId: 1,
        userOfferTemplates: [
          {
            id: 51,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Мистер Пропер',
            userId: 2,
          },
          {
            id: 52,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Дональд Дак',
            userId: 13,
          },
          {
            id: 53,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Спуди Мум',
            userId: 17,
          },
          {
            id: 54,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ЛехаТесть',
            userId: 20,
          },
          {
            id: 55,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ПокаТаксистНоВПланахБизнес',
            userId: 24,
          },
          {
            id: 56,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Барсеточник',
            userId: 30,
          },
          {
            id: 57,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Шурик',
            userId: 47,
          },
          {
            id: 58,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Дуримар',
            userId: 57,
          },
          {
            id: 59,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Вован Шило',
            userId: 73,
          },
        ],
      },
      {
        id: 9,
        geo: 'RU',
        name: 'Команда 2',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Йоринобу Арасака',
        teamId: 2,
        userOfferTemplates: [
          {
            id: 60,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Йоринобу Арасака',
            userId: 3,
          },
          {
            id: 61,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Сопливый Актер',
            userId: 6,
          },
          {
            id: 62,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Бамбл Бизи',
            userId: 14,
          },
          {
            id: 63,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'МишкаСват',
            userId: 21,
          },
          {
            id: 64,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ТаксистИзУбера',
            userId: 26,
          },
          {
            id: 65,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гаврик',
            userId: 83,
          },
        ],
      },
      {
        id: 10,
        geo: 'RU',
        name: 'Команда 3',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Подъездный Байден',
        teamId: 3,
        userOfferTemplates: [
          {
            id: 66,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Подъездный Байден',
            userId: 4,
          },
          {
            id: 67,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Веном',
            userId: 16,
          },
          {
            id: 68,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Мистер Хайд',
            userId: 18,
          },
          {
            id: 69,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Шерлок Холмс',
            userId: 19,
          },
          {
            id: 70,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'СоседСМоейПятины',
            userId: 22,
          },
          {
            id: 71,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'МиллионерИзNL',
            userId: 23,
          },
          {
            id: 72,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ТаксистИзДиди',
            userId: 25,
          },
          {
            id: 73,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Саске',
            userId: 40,
          },
          {
            id: 74,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Наруто',
            userId: 41,
          },
          {
            id: 75,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Димас',
            userId: 78,
          },
          {
            id: 76,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Леха',
            userId: 81,
          },
          {
            id: 77,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Максик',
            userId: 85,
          },
        ],
      },
      {
        id: 11,
        geo: 'RU',
        name: 'Команда 4',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Продавец Анальных Смазок',
        teamId: 4,
        userOfferTemplates: [
          {
            id: 78,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Продавец Анальных Смазок',
            userId: 7,
          },
          {
            id: 79,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Олег Князь',
            userId: 72,
          },
        ],
      },
      {
        id: 12,
        geo: 'RU',
        name: 'Команда 5',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'ВодочкиНамПриноситель',
        teamId: 5,
        userOfferTemplates: [
          {
            id: 80,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'ВодочкиНамПриноситель',
            userId: 9,
          },
          {
            id: 81,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Продавец Шаурмы',
            userId: 31,
          },
          {
            id: 82,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'БратишкаFromGreenElephant',
            userId: 43,
          },
          {
            id: 83,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Мой кореш',
            userId: 46,
          },
          {
            id: 84,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Ван Хельсинг',
            userId: 62,
          },
          {
            id: 85,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гимли',
            userId: 68,
          },
        ],
      },
      {
        id: 13,
        geo: 'RU',
        name: 'Команда 6',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: 'Интердево4ка',
        teamId: 6,
        userOfferTemplates: [
          {
            id: 86,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Брат Путина',
            userId: 5,
          },
          {
            id: 87,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Пидор Из Химок',
            userId: 8,
          },
          {
            id: 88,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Интердево4ка',
            userId: 11,
          },
          {
            id: 89,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Глад Валакас',
            userId: 33,
          },
          {
            id: 90,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Дамблдор',
            userId: 34,
          },
          {
            id: 91,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гермиона',
            userId: 35,
          },
          {
            id: 92,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Рон',
            userId: 37,
          },
          {
            id: 93,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гарри',
            userId: 39,
          },
          {
            id: 94,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Конфето4ка',
            userId: 48,
          },
          {
            id: 95,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Саня_АК-47',
            userId: 50,
          },
          {
            id: 96,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Жека_228',
            userId: 52,
          },
          {
            id: 97,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Саурон',
            userId: 53,
          },
          {
            id: 98,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Леголас',
            userId: 64,
          },
          {
            id: 99,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Гендальф',
            userId: 69,
          },
        ],
      },
      {
        id: 14,
        geo: 'RU',
        name: 'Команда 7',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: 'string2',
        cap: 220,
        responsible: '',
        teamId: 7,
        userOfferTemplates: [
          {
            id: 100,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: 'string2',
            cap: 220,
            responsible: 'Admin',
            userId: 1,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'OfferTemp2',
    geo: 'RU',
    advertiser: 'Shakes',
    conditions: 'stringA',
    offerStatus: 2,
    comment: 'string2',
    cap: 220,
    teamOfferTemplates: [
      {
        id: 15,
        geo: 'RU',
        name: 'Команда 1',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: 'Мистер Пропер',
        teamId: 1,
        userOfferTemplates: [
          {
            id: 101,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Мистер Пропер',
            userId: 2,
          },
          {
            id: 102,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Дональд Дак',
            userId: 13,
          },
          {
            id: 103,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Спуди Мум',
            userId: 17,
          },
          {
            id: 104,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'ЛехаТесть',
            userId: 20,
          },
          {
            id: 105,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'ПокаТаксистНоВПланахБизнес',
            userId: 24,
          },
          {
            id: 106,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Барсеточник',
            userId: 30,
          },
          {
            id: 107,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Шурик',
            userId: 47,
          },
          {
            id: 108,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Дуримар',
            userId: 57,
          },
          {
            id: 109,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Вован Шило',
            userId: 73,
          },
        ],
      },
      {
        id: 16,
        geo: 'RU',
        name: 'Команда 2',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: 'Йоринобу Арасака',
        teamId: 2,
        userOfferTemplates: [
          {
            id: 110,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Йоринобу Арасака',
            userId: 3,
          },
          {
            id: 111,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Сопливый Актер',
            userId: 6,
          },
          {
            id: 112,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Бамбл Бизи',
            userId: 14,
          },
          {
            id: 113,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'МишкаСват',
            userId: 21,
          },
          {
            id: 114,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'ТаксистИзУбера',
            userId: 26,
          },
          {
            id: 115,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Гаврик',
            userId: 83,
          },
        ],
      },
      {
        id: 17,
        geo: 'RU',
        name: 'Команда 3',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: 'Подъездный Байден',
        teamId: 3,
        userOfferTemplates: [
          {
            id: 116,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Подъездный Байден',
            userId: 4,
          },
          {
            id: 117,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Веном',
            userId: 16,
          },
          {
            id: 118,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Мистер Хайд',
            userId: 18,
          },
          {
            id: 119,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Шерлок Холмс',
            userId: 19,
          },
          {
            id: 120,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'СоседСМоейПятины',
            userId: 22,
          },
          {
            id: 121,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'МиллионерИзNL',
            userId: 23,
          },
          {
            id: 122,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'ТаксистИзДиди',
            userId: 25,
          },
          {
            id: 123,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Саске',
            userId: 40,
          },
          {
            id: 124,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Наруто',
            userId: 41,
          },
          {
            id: 125,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Димас',
            userId: 78,
          },
          {
            id: 126,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Леха',
            userId: 81,
          },
          {
            id: 127,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Максик',
            userId: 85,
          },
        ],
      },
      {
        id: 18,
        geo: 'RU',
        name: 'Команда 4',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: 'Продавец Анальных Смазок',
        teamId: 4,
        userOfferTemplates: [
          {
            id: 128,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Продавец Анальных Смазок',
            userId: 7,
          },
          {
            id: 129,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Олег Князь',
            userId: 72,
          },
        ],
      },
      {
        id: 19,
        geo: 'RU',
        name: 'Команда 5',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: 'ВодочкиНамПриноситель',
        teamId: 5,
        userOfferTemplates: [
          {
            id: 130,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'ВодочкиНамПриноситель',
            userId: 9,
          },
          {
            id: 131,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Продавец Шаурмы',
            userId: 31,
          },
          {
            id: 132,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'БратишкаFromGreenElephant',
            userId: 43,
          },
          {
            id: 133,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Мой кореш',
            userId: 46,
          },
          {
            id: 134,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Ван Хельсинг',
            userId: 62,
          },
          {
            id: 135,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Гимли',
            userId: 68,
          },
        ],
      },
      {
        id: 20,
        geo: 'RU',
        name: 'Команда 6',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: 'Интердево4ка',
        teamId: 6,
        userOfferTemplates: [
          {
            id: 136,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Брат Путина',
            userId: 5,
          },
          {
            id: 137,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Пидор Из Химок',
            userId: 8,
          },
          {
            id: 138,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Интердево4ка',
            userId: 11,
          },
          {
            id: 139,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Глад Валакас',
            userId: 33,
          },
          {
            id: 140,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Дамблдор',
            userId: 34,
          },
          {
            id: 141,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Гермиона',
            userId: 35,
          },
          {
            id: 142,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Рон',
            userId: 37,
          },
          {
            id: 143,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Гарри',
            userId: 39,
          },
          {
            id: 144,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Конфето4ка',
            userId: 48,
          },
          {
            id: 145,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Саня_АК-47',
            userId: 50,
          },
          {
            id: 146,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Жека_228',
            userId: 52,
          },
          {
            id: 147,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Саурон',
            userId: 53,
          },
          {
            id: 148,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Леголас',
            userId: 64,
          },
          {
            id: 149,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Гендальф',
            userId: 69,
          },
        ],
      },
      {
        id: 21,
        geo: 'RU',
        name: 'Команда 7',
        advertiser: 'Shakes',
        conditions: 'stringA',
        offerStatus: 2,
        comment: '',
        cap: 0,
        responsible: '',
        teamId: 7,
        userOfferTemplates: [
          {
            id: 150,
            name: null,
            geo: 'RU',
            advertiser: 'Shakes',
            conditions: 'stringA',
            offerStatus: 2,
            comment: '',
            cap: 0,
            responsible: 'Admin',
            userId: 1,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'string',
    geo: 'string',
    advertiser: 'string',
    conditions: 'string',
    offerStatus: 0,
    comment: 'string',
    cap: 0,
    teamOfferTemplates: [
      {
        id: 22,
        geo: 'string',
        name: 'Команда 1',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: 'Мистер Пропер',
        teamId: 1,
        userOfferTemplates: [
          {
            id: 151,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Мистер Пропер',
            userId: 2,
          },
          {
            id: 152,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Дональд Дак',
            userId: 13,
          },
          {
            id: 153,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Спуди Мум',
            userId: 17,
          },
          {
            id: 154,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'ЛехаТесть',
            userId: 20,
          },
          {
            id: 155,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'ПокаТаксистНоВПланахБизнес',
            userId: 24,
          },
          {
            id: 156,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Барсеточник',
            userId: 30,
          },
          {
            id: 157,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Шурик',
            userId: 47,
          },
          {
            id: 158,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Дуримар',
            userId: 57,
          },
          {
            id: 159,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Вован Шило',
            userId: 73,
          },
        ],
      },
      {
        id: 23,
        geo: 'string',
        name: 'Команда 2',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: 'Йоринобу Арасака',
        teamId: 2,
        userOfferTemplates: [
          {
            id: 160,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Йоринобу Арасака',
            userId: 3,
          },
          {
            id: 161,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Сопливый Актер',
            userId: 6,
          },
          {
            id: 162,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Бамбл Бизи',
            userId: 14,
          },
          {
            id: 163,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'МишкаСват',
            userId: 21,
          },
          {
            id: 164,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'ТаксистИзУбера',
            userId: 26,
          },
          {
            id: 165,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Гаврик',
            userId: 83,
          },
        ],
      },
      {
        id: 24,
        geo: 'string',
        name: 'Команда 3',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: 'Подъездный Байден',
        teamId: 3,
        userOfferTemplates: [
          {
            id: 166,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Подъездный Байден',
            userId: 4,
          },
          {
            id: 167,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Веном',
            userId: 16,
          },
          {
            id: 168,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Мистер Хайд',
            userId: 18,
          },
          {
            id: 169,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Шерлок Холмс',
            userId: 19,
          },
          {
            id: 170,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'СоседСМоейПятины',
            userId: 22,
          },
          {
            id: 171,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'МиллионерИзNL',
            userId: 23,
          },
          {
            id: 172,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'ТаксистИзДиди',
            userId: 25,
          },
          {
            id: 173,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Саске',
            userId: 40,
          },
          {
            id: 174,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Наруто',
            userId: 41,
          },
          {
            id: 175,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Димас',
            userId: 78,
          },
          {
            id: 176,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Леха',
            userId: 81,
          },
          {
            id: 177,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Максик',
            userId: 85,
          },
        ],
      },
      {
        id: 25,
        geo: 'string',
        name: 'Команда 4',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: 'Продавец Анальных Смазок',
        teamId: 4,
        userOfferTemplates: [
          {
            id: 178,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Продавец Анальных Смазок',
            userId: 7,
          },
          {
            id: 179,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Олег Князь',
            userId: 72,
          },
        ],
      },
      {
        id: 26,
        geo: 'string',
        name: 'Команда 5',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: 'ВодочкиНамПриноситель',
        teamId: 5,
        userOfferTemplates: [
          {
            id: 180,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'ВодочкиНамПриноситель',
            userId: 9,
          },
          {
            id: 181,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Продавец Шаурмы',
            userId: 31,
          },
          {
            id: 182,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'БратишкаFromGreenElephant',
            userId: 43,
          },
          {
            id: 183,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Мой кореш',
            userId: 46,
          },
          {
            id: 184,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Ван Хельсинг',
            userId: 62,
          },
          {
            id: 185,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Гимли',
            userId: 68,
          },
        ],
      },
      {
        id: 27,
        geo: 'string',
        name: 'Команда 6',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: 'Интердево4ка',
        teamId: 6,
        userOfferTemplates: [
          {
            id: 186,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Брат Путина',
            userId: 5,
          },
          {
            id: 187,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Пидор Из Химок',
            userId: 8,
          },
          {
            id: 188,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Интердево4ка',
            userId: 11,
          },
          {
            id: 189,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Глад Валакас',
            userId: 33,
          },
          {
            id: 190,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Дамблдор',
            userId: 34,
          },
          {
            id: 191,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Гермиона',
            userId: 35,
          },
          {
            id: 192,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Рон',
            userId: 37,
          },
          {
            id: 193,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Гарри',
            userId: 39,
          },
          {
            id: 194,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Конфето4ка',
            userId: 48,
          },
          {
            id: 195,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Саня_АК-47',
            userId: 50,
          },
          {
            id: 196,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Жека_228',
            userId: 52,
          },
          {
            id: 197,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Саурон',
            userId: 53,
          },
          {
            id: 198,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Леголас',
            userId: 64,
          },
          {
            id: 199,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Гендальф',
            userId: 69,
          },
        ],
      },
      {
        id: 28,
        geo: 'string',
        name: 'Команда 7',
        advertiser: 'string',
        conditions: 'string',
        offerStatus: 0,
        comment: '',
        cap: 0,
        responsible: '',
        teamId: 7,
        userOfferTemplates: [
          {
            id: 200,
            name: null,
            geo: 'string',
            advertiser: 'string',
            conditions: 'string',
            offerStatus: 0,
            comment: '',
            cap: 0,
            responsible: 'Admin',
            userId: 1,
          },
        ],
      },
    ],
  },
];
