import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IFilter, ReportGrouping, TrafficService } from '../../shared/services/traffic.service';
import { map, switchMap } from 'rxjs/operators';
import { formatDate } from '@angular/common';
import * as moment from 'moment';
import { combineLatest } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '../../shared/services/auth.service';
import { DefaultSelect, TableTrafficBase } from '../shared/table-traffic.base';
import { includes } from 'lodash';

export const VIEW_DATA = [
  'bot_share',
  'clicks',
  'campaign_unique_clicks',
  'conversions',
  'cost',
  'sale_revenue',
  'profit_confirmed',
  'roi_confirmed',
];

@UntilDestroy()
@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss'],
})
export class StatisticComponent extends TableTrafficBase {
  campaigns: any[] = [DefaultSelect];
  campaignsList: any[] = [DefaultSelect];

  constructor(private trafficService: TrafficService, cd: ChangeDetectorRef, auth: AuthService) {
    super('statistic', VIEW_DATA, cd, auth);
  }

  init() {
    this.loading = true;

    let dataFromStorage: any = localStorage.getItem(this.prefix);
    dataFromStorage = dataFromStorage ? JSON.parse(dataFromStorage) : [];

    this.filters = { ...this.filters, ...dataFromStorage.filters };
    this.selectedFilters = dataFromStorage?.metrics || this.metricsAllDefault;

    const metricsForm = dataFromStorage?.metricsForm;
    if (metricsForm) {
      this.metrics.patchValue(metricsForm);
    }

    const filterPeriod = dataFromStorage?.filterPeriod;
    if (filterPeriod) {
      this.campaignOne.patchValue({
        start: moment(filterPeriod.start),
        end: moment(filterPeriod.end),
      });
    }

    combineLatest(this.getMetrics(), this.getGrouped(), this.trafficService.getCampaigns())
      .pipe(untilDestroyed(this))
      .subscribe(
        ([metrics, grouped, campaigns]) => {
          this.setDefaultFilters(grouped[0][0].teamId, metrics);
          this.source = grouped ?? [];
          this.campaigns = campaigns;
          this.applyFilters();
          this.updateByFilters();
        },
        error => (this.loading = false)
      );
  }

  getMetrics() {
    return this.trafficService.getMetrics();
  }

  getGrouped() {
    return this.trafficService.getGrouped();
  }

  getData(filteredDate) {
    const filters: IFilter = {
      teamId: (this.filters && this.filters['team']?.filterValue) || undefined,
      userIds: [],
      groupIds: [],
      campaignId: (this.filters && this.filters['campaign']?.filterValue) || undefined,
      metrics: this.filters && this.filters['metrics']?.filterValue,
      grouping: this.filters && this.filters['grouping']?.filterValue,
    };
    const campaignGroupId =
      this.filters &&
      this.filters['campaign']?.filterValue &&
      this.campaignsList.find(({ id }) => id === this.filters['campaign']?.filterValue)?.group_id;
    if (campaignGroupId) {
      filters.groupIds.push(campaignGroupId);
    }
    this.filters &&
      this.filters['user']?.filterValue &&
      filters.userIds.push(this.filters && this.filters['user']?.filterValue);
    return this.loadData(filteredDate, filters);
  }

  loadData(filteredDate, filters) {
    return this.trafficService.getDashboard(filteredDate, filters);
  }

  setCharts(chartData) {
    const getByKey = key => chartData.map(el => [el.timestamp, el[key]]);

    this.metricsAll = this.metricsAllDefault.map(el => ({ ...el, data: getByKey(el.key) }));

    const selected = this.selectedFilters.map(({ key }) => key);
    this.metricsAll = this.metricsAll.map(el => ({ ...el, checked: selected.includes(el.key) }));
    this.selectedFilters = this.metricsAll.filter(el => selected.includes(el.key));
    this.metrics.patchValue(this.selectedFilters);
    this.cd.detectChanges();
  }

  applyFilters() {
    super.applyFilters();
    const setCampaignList = () => {
      this.campaignsList = [
        DefaultSelect,
        ...this.campaigns
          .filter(({ userId, teamId }) => {
            if (user && team) return userId === user && teamId === team;
            if (user || team) return userId === user || teamId === team;
            return !this.isAdminOrTeamLead;
          })
          .map(({ id, name, group_id }) => ({ id, name, group_id })),
      ];
    };

    const team = this.filters && this.filters['team']?.filterValue;
    const user = this.filters && this.filters['user']?.filterValue;

    if (!this.isAdminOrTeamLead || team) {
      setCampaignList();
    }
  }

  get colors() {
    const data = document.querySelectorAll('.highcharts-legend-item');
    const metrics = {};
    data.forEach(
      m => (metrics[m.querySelector('text tspan').innerHTML] = m.querySelector('rect').getAttribute('fill'))
    );
    return metrics;
  }

  totalMetric(key) {
    const source = this.selectedFilters.find(el => el.key === key)?.data.map(el => el[1]) || [];
    return source.reduce((acc, cur) => acc + cur, 0);
  }
}
