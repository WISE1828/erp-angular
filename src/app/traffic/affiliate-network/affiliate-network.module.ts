import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { AffiliateNetworkComponent } from './affiliate-network.component';
import { AffiliateNetworkRoutingModule } from './affiliate-network-routing.module';

@NgModule({
  declarations: [AffiliateNetworkComponent],
  imports: [
    CommonModule,
    AffiliateNetworkRoutingModule,
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
export class AffiliateNetworkModule {}
