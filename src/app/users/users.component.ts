import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { IUserInfo, UserInfoService } from '../shared/services/user-info.service';
import { Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface UsersView {
  id: number;
  name: string;
  role: string;
  team: string;
  status: string;
  isActive: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'role', 'team', 'status'];
  dataSource: MatTableDataSource<UsersView> = new MatTableDataSource<UsersView>([]);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private userInfoService: UserInfoService, public auth: AuthService, private cd: ChangeDetectorRef) {}

  users$: Observable<IUserInfo[]> = this.userInfoService.getAllUsers();
  loading = false;
  roles = this.auth.rolesRU;
  teamList = [];
  roleList = [];
  filters: { [key: string]: { filterValue: string; filterField?: string } };
  role;

  ngOnInit(): void {
    this.role = +localStorage.getItem('role');
    this.loading = true;
    this.users$.pipe(untilDestroyed(this)).subscribe(
      users => {
        this.dataSource.data = users.map(user => ({
          id: user.id,
          name: user?.userName || '-',
          role: String(this.roles[user.roleId] || '-'),
          team: String(user?.teamId || '-'),
          status: user.isActive ? 'Активен' : 'Заблокирован',
          isActive: user.isActive,
        }));
        this.teamList = [...new Set(['', ...this.dataSource.data.map(({ team }) => (!isNaN(+team) ? +team : ''))])];
        this.roleList = [...new Set(['', ...this.dataSource.data.map(({ role }) => role)])];
        this.loading = false;
        this.cd.detectChanges();
      },
      () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    );
  }

  setFilter(filter) {
    this.filters = { ...this.filters, [filter.filterField]: { ...filter } };
    this.applyFilter();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter() {
    this.dataSource.filterPredicate = (data, filter) => {
      return Object.keys(this.filters).every(filterKey => {
        const filterItem = this.filters[filterKey];

        const dataStr = Object.keys(data)
          .filter(key => (filterItem.filterField != 'all' ? filterItem.filterField === key : true))
          .reduce((currentTerm, key) => {
            return currentTerm + data[key] + '◬';
          }, '')
          .toLowerCase();
        const transformedFilter = filterItem.filterValue.trim().toLowerCase();
        return dataStr.indexOf(transformedFilter) != -1;
      });
    };
    this.dataSource.filter = 'upd';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    this.cd.detectChanges();
  }

  get isPromoOrItTeamLead() {
    return [+this.auth.roles.teamLeadTechnicalSpecialist, +this.auth.roles.teamLeadPromotion].includes(+this.role);
  }
}
