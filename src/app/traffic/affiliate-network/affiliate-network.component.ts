import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TableTrafficBase } from '../shared/table-traffic.base';
import { TrafficService } from '../../shared/services/traffic.service';
import { AuthService } from '../../shared/services/auth.service';

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

@Component({
  selector: 'app-affiliate-network',
  templateUrl: './affiliate-network.component.html',
  styleUrls: ['../shared/traffic-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffiliateNetworkComponent extends TableTrafficBase {
  constructor(private trafficService: TrafficService, cd: ChangeDetectorRef, auth: AuthService) {
    super('affiliate-network', VIEW_DATA, cd, auth);
  }

  getMetrics() {
    // TODO: need back
    return this.trafficService.getTrafficSourcesMetrics();
  }

  getGrouped() {
    // TODO: need back
    return this.trafficService.getGrouped();
  }

  loadData(filteredDate, filters) {
    // TODO: need back
    return this.trafficService.getTrafficSources(filteredDate, filters);
  }
}
