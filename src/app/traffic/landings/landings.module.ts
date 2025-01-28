import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LandingsRoutingModule } from './landings-routing.module';
import { LandingsComponent } from './landings.component';
import { SharedModule } from '../../shared/shared.module';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NgxMatTimepickerModule,
} from '@angular-material-components/datetime-picker';
import { CdkTableModule } from '@angular/cdk/table';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [LandingsComponent],
  imports: [
    CommonModule,
    LandingsRoutingModule,
    SharedModule,
    MatGridListModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    CdkTableModule,
    MatTableModule,
    ScrollingModule,
  ],
})
export class LandingsModule {}
