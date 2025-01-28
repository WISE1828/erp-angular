import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StatisticComponent } from './statistic.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: StatisticComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class StatisticRoutingModule {}
