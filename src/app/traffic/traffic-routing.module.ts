import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrafficComponent } from './traffic.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: TrafficComponent,
        children: [
          { path: '', redirectTo: `statistic`, pathMatch: 'full' },
          {
            path: 'statistic',
            loadChildren: () => import('./statistic/statistic.module').then(m => m.StatisticModule),
          },
          {
            path: 'landings',
            loadChildren: () => import('./landings/landings.module').then(m => m.LandingsModule),
          },
          {
            path: 'offers',
            loadChildren: () => import('./offers/offers.module').then(m => m.OffersModule),
          },
          {
            path: 'campaigns',
            loadChildren: () => import('./campaigns/campaigns.module').then(m => m.CampaignsModule),
          },
          { path: 'sources', loadChildren: () => import('./sources/sources.module').then(m => m.SourcesModule) },
          {
            path: 'affiliate-network',
            loadChildren: () =>
              import('./affiliate-network/affiliate-network.module').then(m => m.AffiliateNetworkModule),
          },
          {
            path: 'kpi',
            loadChildren: () => import('./kpi/kpi.module').then(m => m.KpiModule),
          },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class TrafficRoutingModule {}
