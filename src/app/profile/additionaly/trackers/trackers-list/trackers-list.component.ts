import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileAdditionalyService } from '../../../../shared/services/profile-additionaly.service';
import { of } from 'rxjs';
import { TrackerItemComponent } from '../tracker-item/tracker-item.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-trackers-list',
  templateUrl: './trackers-list.component.html',
  styleUrls: ['./trackers-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackersListComponent implements OnInit {
  loading = false;
  trackersList: any[] = [];

  mapKeitaro = tracker => ({
    name: tracker.name,
    imageUrl: '/assets/img/trackers/keitaro.png',
    status: tracker.isSynchronized,
    key: 'Keitaro',
    action: () => {
      const dialogRef = this.dialog.open(TrackerItemComponent, {
        autoFocus: false,
        hasBackdrop: true,
        data: {
          title: 'Keitaro',
          token: tracker.token,
        },
      });
      dialogRef
        .afterClosed()
        .pipe(
          untilDestroyed(this),
          switchMap(data => (data ? this.trackers$ : of(null)))
        )
        .subscribe(
          () => {
            this.cd.detectChanges();
          },
          () => {
            this.cd.detectChanges();
          }
        );
    },
  });

  constructor(
    private dialog: MatDialog,
    private profileAdditionalyService: ProfileAdditionalyService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.trackers$.pipe(untilDestroyed(this)).subscribe(
      () => {
        this.cd.detectChanges();
      },
      () => {
        this.cd.detectChanges();
      }
    );
  }

  get trackers$() {
    return this.profileAdditionalyService.getTrackers().pipe(
      map(tracker => [{ ...this.mapKeitaro(tracker.keitaro) }]),
      tap(trackers => (this.trackersList = trackers))
    );
  }
}
