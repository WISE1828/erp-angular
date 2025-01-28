import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TrafficService } from '../../shared/services/traffic.service';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DefaultSelect, TableTrafficBase } from '../shared/table-traffic.base';

const VIEW_DATA = [
  'offer_id',
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
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['../shared/traffic-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffersComponent extends TableTrafficBase {
  partnerNetworkList = [];

  constructor(private trafficService: TrafficService, cd: ChangeDetectorRef, auth: AuthService) {
    super('offers', VIEW_DATA, cd, auth);
  }

  getMetrics() {
    return this.trafficService.getOffersMetrics();
  }

  getGrouped() {
    return this.trafficService.getGrouped();
  }

  loadData(filteredDate, filters) {
    return this.trafficService.getOffers(filteredDate, filters);
  }

  applyFilters() {
    const setPartnerNetworkList = () => {
      this.partnerNetworkList = [];
      this.source?.forEach(arr => {
        arr.forEach(el => {
          const offerGroupId = el.partnerNetworkIdentityKeysBunch.keitaroKeys.offerGroupId;
          return !this.partnerNetworkList.includes(offerGroupId) && this.partnerNetworkList.push(offerGroupId);
        });
      });
      if (this.dataSource?.data?.length && this.partnerNetworkList.length) {
        this.partnerNetworkList = [...new Set(this.dataSource.data.map(({ affiliate_network }) => affiliate_network))]
          .filter(Boolean)
          .map(el => ({ id: el, name: el }));
      }
      this.partnerNetworkList.unshift(DefaultSelect);
    };
    setPartnerNetworkList();
    super.applyFilters();
  }
}
