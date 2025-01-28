import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiComponent } from './kpi.component';
import { KpiRoutingModule } from './kpi-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { KpiCreateDialogComponent } from './kpi-create-dialog/kpi-create-dialog.component';
import { KpiHistoryComponent } from './kpi-history/kpi-history.component';

@NgModule({
  declarations: [KpiComponent, KpiCreateDialogComponent, KpiHistoryComponent],
  imports: [CommonModule, KpiRoutingModule, SharedModule],
})
export class KpiModule {}
