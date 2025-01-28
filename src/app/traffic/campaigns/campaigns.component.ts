import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { TrafficService } from '../../shared/services/traffic.service';
import { AuthService } from '../../shared/services/auth.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DefaultSelect, TableTrafficBase } from '../shared/table-traffic.base';

const VIEW_DATA = [
  'campaign',
  'bot_share',
  'campaign_id',
  'clicks',
  'campaign_unique_clicks',
  'conversions',
  'cost',
  'sale_revenue',
  'profit_confirmed',
  'roi_confirmed',
  'campaign_group_id',
  'ts',
];

@UntilDestroy()
@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['../shared/traffic-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent extends TableTrafficBase {
  sourcesList = [];

  constructor(private trafficService: TrafficService, cd: ChangeDetectorRef, auth: AuthService) {
    super('campaigns', VIEW_DATA, cd, auth);
  }

  getMetrics() {
    return this.trafficService.getMetrics();
  }

  getGrouped() {
    return this.trafficService.getGrouped();
  }

  loadData(filteredDate, filters) {
    return this.trafficService.getCampaignsStatistic(filteredDate, filters);
  }

  applyFilters() {
    const setSourcesList = () => {
      this.sourcesList = [];
      if (this.dataSource?.data?.length) {
        this.sourcesList = [...new Set(this.dataSource.data.map(({ ts }) => ts))]
          .filter(Boolean)
          .map(el => ({ id: el, name: el }));
      }
      this.sourcesList.unshift(DefaultSelect);
    };
    setSourcesList();
    super.applyFilters();
  }
}
