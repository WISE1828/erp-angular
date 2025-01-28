import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TrafficService } from '../../shared/services/traffic.service';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TableTrafficBase } from '../shared/table-traffic.base';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

const VIEW_DATA = [
  'profitability',
  'country',
  'affiliate_network',
  'clicks',
  'leads',
  'sales',
  'rejected',
  'cr',
  'epc_confirmed',
  'cpc',
  'sale_revenue',
  'cost',
  'profit_confirmed',
  'roi_confirmed',
];

@UntilDestroy()
@Component({
  selector: 'app-landings',
  templateUrl: './sources.component.html',
  styleUrls: ['../shared/traffic-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourcesComponent extends TableTrafficBase {
  constructor(private trafficService: TrafficService, cd: ChangeDetectorRef, auth: AuthService) {
    super('sources', VIEW_DATA, cd, auth);
  }

  getMetrics() {
    return this.trafficService.getTrafficSourcesMetrics();
  }

  getGrouped() {
    return this.trafficService.getGrouped();
  }

  loadData(filteredDate, filters) {
    return this.trafficService.getTrafficSources(filteredDate, filters);
  }
}
