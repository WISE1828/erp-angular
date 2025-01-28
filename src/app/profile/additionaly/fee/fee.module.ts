import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeeListComponent } from './fee-list/fee-list.component';
import { FeeItemComponent } from './fee-item/fee-item.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [FeeListComponent, FeeItemComponent],
  imports: [CommonModule, SharedModule],
})
export class FeeModule {}
