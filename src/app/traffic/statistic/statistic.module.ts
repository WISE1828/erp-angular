import { NgModule } from '@angular/core';
import { StatisticComponent } from './statistic.component';
import { SharedModule } from '../../shared/shared.module';
import { StatisticRoutingModule } from './statistic-routing.module';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NgxMatTimepickerModule,
} from '@angular-material-components/datetime-picker';

@NgModule({
  declarations: [StatisticComponent],
  imports: [
    SharedModule,
    StatisticRoutingModule,
    MatGridListModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
  ],
})
export class StatisticModule {}
