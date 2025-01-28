import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { KpiComponent } from './kpi.component';
import { KpiHistoryComponent } from './kpi-history/kpi-history.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: KpiComponent,
      },
      {
        path: 'history',
        component: KpiHistoryComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class KpiRoutingModule {}
