import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { BudgetListComponent } from './budget-list/budget-list.component';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSliderModule } from '@angular/material/slider';
import { BudgetItemComponent } from './budget-item/budget-item.component';

@NgModule({
  declarations: [BudgetListComponent, BudgetItemComponent],
  imports: [CommonModule, SharedModule, CdkTableModule, MatSliderModule],
  exports: [BudgetListComponent, BudgetItemComponent],
})
export class BudgetModule {}
