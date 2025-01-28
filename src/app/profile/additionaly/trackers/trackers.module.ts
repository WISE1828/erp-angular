import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackersListComponent } from './trackers-list/trackers-list.component';
import { TrackerItemComponent } from './tracker-item/tracker-item.component';
import { SharedModule } from '../../../shared/shared.module';
import { MatListModule } from '@angular/material/list';

@NgModule({
  declarations: [TrackersListComponent, TrackerItemComponent],
  imports: [CommonModule, MatListModule, SharedModule],
})
export class TrackersModule {}
