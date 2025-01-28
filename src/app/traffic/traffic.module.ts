import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrafficComponent } from './traffic.component';
import { TrafficRoutingModule } from './traffic-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [TrafficComponent],
  imports: [CommonModule, TrafficRoutingModule, SharedModule],
})
export class TrafficModule {}
