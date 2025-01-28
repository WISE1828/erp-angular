import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TrafficService } from '../../shared/services/traffic.service';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TableTrafficBase } from '../shared/table-traffic.base';

const VIEW_DATA = [
  'clicks',
  'conversions',
  'cr',
  'epc_confirmed',
  'cpc',
  'profit_confirmed',
  'cost',
  'sale_revenue',
  'roi_confirmed',
];

@UntilDestroy()
@Component({
  selector: 'app-landings',
  templateUrl: './landings.component.html',
  styleUrls: ['../shared/traffic-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingsComponent extends TableTrafficBase {
  constructor(private trafficService: TrafficService, cd: ChangeDetectorRef, auth: AuthService) {
    super('landings', VIEW_DATA, cd, auth);
  }

  getMetrics() {
    return this.trafficService.getLandingsMetrics();
  }

  getGrouped() {
    return this.trafficService.getGrouped();
  }

  loadData(filteredDate, filters) {
    return this.trafficService.getLandings(filteredDate, filters);
  }
}
