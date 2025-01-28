import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProfileAdditionalyService } from '../../../../shared/services/profile-additionaly.service';
import { map, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../shared/services/notification.service';
import { TrackersService } from '../../../../shared/services/trackers.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { UserInfoService } from '../../../../shared/services/user-info.service';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as moment from 'moment';
import { WorkPerformanceService } from '../../../../shared/services/work-performance.service';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';

@UntilDestroy()
@Component({
  selector: 'app-budget-item',
  templateUrl: './budget-item.component.html',
  styleUrls: ['./budget-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetItemComponent implements OnInit {
  role;
  loading = false;

  teamList$ = this.userInfoService.getUsersGrouped().pipe(
    map(data => {
      return data.reduce((acc, el) => {
        const id = el.map(({ teamId }) => teamId)[0];
        const users = el;
        if (isNotNullOrUndefined(id)) {
          acc.push({ id, users });
        }
        return acc;
      }, []);
    })
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<BudgetItemComponent>,
    private profileAdditionalyService: ProfileAdditionalyService,
    private notificationService: NotificationService,
    private trackersService: TrackersService,
    private userInfoService: UserInfoService,
    private workPerformanceService: WorkPerformanceService,
    private auth: AuthService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {}

  form = this.fb.group({
    teamId: this.fb.control(null, Validators.required),
    commonBudget: this.fb.control(0, [Validators.required]),
    personalBudgets: this.fb.array([]),
  });

  userList = [];
  teamList = [];

  formatLabel(value: number) {
    return value;
  }

  ngOnInit() {
    this.loading = true;
    this.teamList$
      .pipe(
        tap(data => {
          if (this.data?.filterTeamList && this?.data?.mode === 'Create') {
            data = data.filter(({ id }) => !this.data?.filterTeamList.includes(id));
          }
          this.teamList = data;
          this.cd.detectChanges();
        }),
        untilDestroyed(this)
      )
      .subscribe(
        () => {
          this.init();
          this.loading = false;
          this.cd.detectChanges();
        },
        error => {
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }

  init() {
    this.role = +localStorage.getItem('role');

    this.form
      .get('teamId')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe(teamId => {
        this.personalBudgets.clear();
        this.teamList
          .find(({ id }) => id === teamId)
          ?.users?.map(user => {
            const payload = {
              id: user.id,
              name: user.userName,
              budget: this.data?.personalBudgets?.find(({ userId }) => userId === user.id)?.budget || 0,
            };

            this.personalBudgets.push(this.fb.group(payload));
          });
      });

    if (this.isAdmin) {
      this.form
        .get('commonBudget')
        .valueChanges.pipe(untilDestroyed(this))
        .subscribe(teamId => {
          this.personalBudgets.patchValue(this.personalBudgets.value.map(d => ({ ...d, budget: 0 })));
        });
    }

    if (this.data?.mode === 'Update') {
      this.form.patchValue(this.data);
      this.form.get('teamId').disable();
    }

    if (!this.isAdmin) {
      this.form.get('commonBudget').disable();
    }

    this.cd.detectChanges();
  }

  get commonBudget() {
    return this.form?.getRawValue()?.commonBudget;
  }

  checkValue(value) {
    const currentValue = value;
    const minValue = this.commonBudget - this.notAllocatedMoney;
    if (currentValue < minValue || currentValue <= 0) {
      this.form.get('commonBudget').patchValue(minValue);
    }
  }

  get personalBudgets() {
    return this.form.get('personalBudgets') as FormArray;
  }

  save(): void {
    let formData = this.form.getRawValue();
    let payload = {
      ...formData,
      date: this.userInfoService?.date,
      personalBudgets: formData.personalBudgets.map(({ id, budget }) => ({
        userId: id,
        budget,
        workPerformanceId: this.data?.id || undefined,
      })),
    };
    const action =
      this.data?.mode === 'Update'
        ? this.workPerformanceService.updateById(this.data.id, payload)
        : this.workPerformanceService.create(payload);
    action.pipe(untilDestroyed(this)).subscribe(
      d => {
        this.loading = true;
        this.back(true);
        this.notificationService.showMessage(
          'success',
          `План успешно ${this.data?.mode === 'Update' ? 'обновлен' : 'создан'}`
        );
      },
      error => {
        this.loading = false;
        this.notificationService.showMessage(
          'error',
          `При ${this.data?.mode === 'Update' ? 'обновлении' : 'создании'} плана произошла ошибка`
        );
      }
    );
  }

  back(result?) {
    this.dialogRef.close(result);
  }

  get isAdmin() {
    return (
      [+this.auth.roles.admin, +this.auth.roles.financier].includes(+this.role) &&
      (this.userInfoService.userInfo?.roleId === +this.auth.roles.admin ||
        this.userInfoService.userInfo?.roleId === +this.auth.roles.financier)
    );
  }

  get notAllocatedMoney() {
    const form = this.form.getRawValue();
    if (form?.commonBudget > 0) {
      const moneyHasUsers = form?.personalBudgets?.reduce((acc, curr) => acc + curr.budget, 0);
      return form?.commonBudget - moneyHasUsers;
    }
    return 0;
  }
}
