import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import * as signalR from '@aspnet/signalr';
import { AppSettings } from '../shared/services/settings';
import { isNullOrUndefined } from 'util';

enum MenuType {
  EXPANDED,
  INLINE,
}
interface IMenu {
  getAccess?: () => boolean;
  type: MenuType;
  name: string;
  expanded?: boolean;
  infoCircle?: any;
  icon?: string;
  getInfoCircle?: Function;
  getRoute?: Function;
  toggle?: Function;
  classList?: any;
  submenu?: IMenu[];
}

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavMenuComponent implements OnInit, OnDestroy {
  @Output() onToggle: EventEmitter<boolean> = new EventEmitter<boolean>(false);
  public expandMenu = true;
  public role: number;
  public userId: string;
  public hubConnection;
  public requestsNumber: number;

  menuTypes = MenuType;
  MENU: IMenu[] = [
    {
      getAccess: () => this.isAccessToWC,
      type: MenuType.EXPANDED,
      name: 'Финансы',
      icon: 'assets/icons/finances.svg',
      expanded: false,
      getRoute: () => 'daily',
      toggle: function () {
        this.expanded = !this.expanded;
      },
      submenu: [
        {
          getAccess: () => localStorage.getItem('role') !== '12',
          name: 'Личные',
          type: MenuType.INLINE,
          getRoute: function () {
            return ['/daily', this.userId];
          }.bind(this),
        },
        {
          getAccess: () => true,
          name: 'Общие',
          type: MenuType.INLINE,
          getRoute: () => '/daily/common',
        },
      ],
    },
    {
      getAccess: () => !this.isAccessToWC && this.isAccessToWCPersonal,
      type: MenuType.INLINE,
      getRoute: () => ['/daily', this.userId],
      icon: 'assets/icons/finances.svg',
      name: 'Финансы',
    },
    {
      getAccess: () => !this.isAccessToWC && this.isAccessToWCCommon,
      type: MenuType.INLINE,
      getRoute: () => '/daily/common',
      icon: 'assets/icons/finances.svg',
      name: 'Финансы',
    },

    {
      getAccess: () => this.isAccessToWC || this.isFinancier,
      type: MenuType.EXPANDED,
      name: 'Оборотные средства',
      icon: 'assets/icons/working_capital.svg',
      expanded: false,
      toggle: function () {
        this.expanded = !this.expanded;
      },
      getInfoCircle: () => this.requestsNumber,
      getRoute: () => 'working_capital',
      submenu: [
        {
          getAccess: () => localStorage.getItem('role') !== '12',
          name: 'Личные',
          type: MenuType.INLINE,
          getRoute: () => ['/working_capital', this.userId],
        },
        {
          getAccess: () => true,
          name: 'Общие',
          type: MenuType.INLINE,
          getInfoCircle: () => this.requestsNumber,
          getRoute: () => '/working_capital/common',
        },
      ],
    },
    {
      getAccess: () => !this.isAccessToWC && this.isAccessToWCPersonal,
      type: MenuType.INLINE,
      getInfoCircle: () => this.requestsNumber,
      getRoute: () => ['/working_capital', this.userId],
      icon: 'assets/icons/working_capital.svg',
      name: 'Оборотные средства',
    },
    {
      getAccess: () => !this.isAccessToWC && this.isAccessToWCCommon,
      type: MenuType.INLINE,
      getRoute: () => '/working_capital/common',
      icon: 'assets/icons/working_capital.svg',
      name: 'Оборотные средства',
    },

    {
      getAccess: () => this.isAdminOrTeamLead || this.isFinancier,
      type: MenuType.EXPANDED,
      name: 'Заявки на аккаунты',
      icon: 'assets/icons/account-request.svg',
      expanded: false,
      toggle: function () {
        this.expanded = !this.expanded;
      },
      getInfoCircle: () => 0,
      getRoute: () => 'account_request',
      submenu: [
        {
          getAccess: () => localStorage.getItem('role') !== '12',
          name: 'Личные',
          type: MenuType.INLINE,
          getRoute: () => ['/account_request', this.userId],
        },
        {
          getAccess: () => true,
          name: 'Общие',
          type: MenuType.INLINE,
          getInfoCircle: () => 0,
          getRoute: () => '/account_request/common',
        },
      ],
    },
    {
      getAccess: () => this.isBayerOrSmartOrHelper,
      type: MenuType.INLINE,
      getInfoCircle: () => 0,
      getRoute: () => ['/account_request', this.userId],
      icon: 'assets/icons/account-request.svg',
      name: 'Заявки на аккаунты',
    },
    {
      getAccess: () => this.isFarmers,
      type: MenuType.INLINE,
      getRoute: () => '/account_request/common',
      icon: 'assets/icons/account-request.svg',
      name: 'Заявки на аккаунты',
    },

    localStorage.getItem('role') !== '12' && {
      getAccess: () => !this.isPersonal || this.isTeamLeadIT,
      type: MenuType.EXPANDED,
      name: 'Расходники',
      icon: 'assets/icons/consumables.svg',
      expanded: false,
      toggle: function () {
        this.expanded = !this.expanded;
      },
      getRoute: () => 'themes/consumables',
      submenu: [
        {
          getAccess: () => true,
          name: 'Аккаунты',
          type: MenuType.INLINE,
          getRoute: () => 'themes/consumables/accounts',
        },
        {
          getAccess: () => true,
          name: 'Домены',
          type: MenuType.INLINE,
          getRoute: () => 'themes/consumables/domens',
        },
        {
          getAccess: () => true,
          name: 'Прокси',
          type: MenuType.INLINE,
          getRoute: () => 'themes/consumables/proxy',
        },
        {
          getAccess: () => true,
          name: 'WhitePages',
          type: MenuType.INLINE,
          getRoute: () => 'themes/consumables/white_pages',
        },
        {
          getAccess: () => true,
          name: 'Платежи',
          type: MenuType.INLINE,
          getRoute: () => 'themes/consumables/payments',
        },
      ],
    },
    {
      getAccess: () => !this.isFinancier,
      type: MenuType.INLINE,
      getRoute: () => 'themes/manuals',
      icon: 'assets/icons/manuals.svg',
      name: 'Мануалы',
    },

    {
      getAccess: () => this.isAdmin,
      type: MenuType.INLINE,
      getRoute: () => '/registration',
      icon: 'assets/icons/account-check-outline.svg',
      name: 'Регистрация пользователей',
    },
    {
      getAccess: () => true,
      type: MenuType.INLINE,
      getRoute: () => '/timesheets',
      icon: 'assets/icons/calendar.svg',
      name: 'Табели',
    },
    {
      getAccess: () => this.isAdmin || this.isPromoOrItTeamLead || this.isFinancier,
      type: MenuType.INLINE,
      getRoute: () => '/users',
      icon: 'assets/icons/users-solid.svg',
      name: 'Пользователи',
    },
    {
      getAccess: () => this.isAdmin,
      type: MenuType.INLINE,
      getRoute: () => '/passwords',
      icon: 'assets/icons/password.svg',
      name: 'Пароли/Доступы',
    },
    {
      getAccess: () => this.isAccessToTraffic,
      type: MenuType.INLINE,
      getRoute: () => '/traffic',
      icon: 'assets/icons/traffic.svg',
      name: 'Трафик',
    },
    {
      getAccess: () => true,
      type: MenuType.INLINE,
      getRoute: () => ['/profile', this.userId],
      icon: 'assets/icons/account-outline.svg',
      name: 'Личный кабинет',
    },
  ];

  hasFnCall = (obj, fn) => obj.hasOwnProperty(fn) && obj[fn]();

  constructor(public auth: AuthService, private cd: ChangeDetectorRef) {}
  get isAdminOrTeamLead() {
    return [+this.auth.roles.admin, +this.auth.roles.teamlead].includes(+this.role);
  }
  get isFinancier() {
    return [+this.auth.roles.financier].includes(+this.role);
  }
  get isAdmin() {
    return [+this.auth.roles.admin].includes(+this.role);
  }
  get isFarmers() {
    return [+this.auth.roles.farmer, +this.auth.roles.farmerTeamlead].includes(+this.role);
  }
  get isCreative() {
    return [+this.auth.roles.creative].includes(+this.role);
  }
  get isTeamLeadIT() {
    return [+this.auth.roles.teamLeadTechnicalSpecialist].includes(this.role);
  }

  get isTechSpecialist() {
    return [+this.auth.roles.techSpecialist].includes(+this.role);
  }

  get isPersonal() {
    return this.isFarmers || this.isCreative || this.isTechSpecialist || this.isPromoOrItTeamLead;
  }
  get isBayerOrSmartOrHelper() {
    return [+this.auth.roles.bayer, +this.auth.roles.smart, +this.auth.roles.helper].includes(+this.role);
  }
  get isPromoOrItTeamLead() {
    return [+this.auth.roles.teamLeadTechnicalSpecialist, +this.auth.roles.teamLeadPromotion].includes(+this.role);
  }
  get isAccessToWCPersonal() {
    return !this.isPersonal;
  }
  get isAccessToWCCommon() {
    return !this.isBayerOrSmartOrHelper && !this.isPersonal;
  }
  get isAccessToWC() {
    return this.isAccessToWCCommon && this.isAccessToWCPersonal;
  }

  get isAccessToTraffic() {
    return this.isBayerOrSmartOrHelper || this.isAdminOrTeamLead || !this.isFinancier;
  }

  ngOnDestroy(): void {
    this.hubConnection?.stop();
  }

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.userId = localStorage.getItem('userId');
    this.expandMenu = !JSON.parse(localStorage.getItem('expandMenu')) || false;
    this.toggleMenu();

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${AppSettings.API_PERSONAL_INFRASTRUCTURE}/moneyRequestHub`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('Connection started');
        this.hubConnection.invoke('Send', message => {}).catch(err => console.log(err));
      })
      .catch(err => console.log('Error while starting connection: ' + err));

    this.hubConnection.on('ReceiveMoneyRequestCount', message => {
      const requests: { [key: string]: number } = JSON.parse(message);
      const isValid = !isNullOrUndefined(requests) && requests?.hasOwnProperty(this.userId);
      this.requestsNumber = (isValid && requests[this.userId]) || null;
      this.cd.detectChanges();
    });
  }

  toggleMenu(): void {
    this.expandMenu = !this.expandMenu;
    localStorage.setItem('expandMenu', JSON.stringify(this.expandMenu));
    this.onToggle.emit(this.expandMenu);
    this.cd.detectChanges();
  }
}
