import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SelectionVisitTypeDialogComponent } from './components/selection-visit-type-dialog/selection-visit-type-dialog.component';

import { TimesheetsComponent } from './timesheets.component';
import { TimesheetsRoutingModule } from './timesheets-routing.module';
import { EmployeeAttendanceTableComponent } from './components/employee-attendance-table/employee-attendance-table.component';
import { EmployeeAttendanceService } from './services/employee-attendance.service';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [TimesheetsComponent, EmployeeAttendanceTableComponent, SelectionVisitTypeDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TimesheetsRoutingModule,
    MatDialogModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    SharedModule,
  ],
  providers: [EmployeeAttendanceService],
})
export class TimesheetsModule {}
