import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AngularEditorConfig } from '../../../html-editor/config';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { BlocksAndThemesService } from '../../../shared/services/blocks-and-themes.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-manual-view',
  templateUrl: './manual-view.component.html',
  styleUrls: ['./manual-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualViewComponent implements OnInit, OnDestroy {
  @Input() set meta(meta: string) {
    this.isReadOnly = false;
    this.getMetaFromStore(meta);
  }
  @Input() set saved(v: any) {
    if (v) {
      this.isSaved = true;
      localStorage.removeItem('lastHTMLManual');
    }
  }
  @Output() metaChanges = new EventEmitter();
  @HostListener('window:beforeunload')
  doSomething() {
    this.saveLastManualToStore();
  }

  getMetaFromStore(meta) {
    const lastHTMLManual = localStorage.getItem('lastHTMLManual');
    localStorage.removeItem('lastHTMLManual');
    this.htmlContent = meta;
    if (lastHTMLManual) {
      const draftMeta = JSON.parse(lastHTMLManual);
      this.setDialogGetLastManual(draftMeta);
    }
  }

  state$: Observable<object>;
  isReadOnly = true;
  isSaved = false;
  isFullSize = false;

  config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    sanitize: false,
    height: 'fit-content',
    maxHeight: '82vh',
    minHeight: '10rem',
    placeholder: 'Начните создавать контент..',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Roboto',
    fonts: [
      { class: 'roboto', name: 'Roboto' },
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' },
      { class: 'coda-caption', name: 'Coda Caption' },
      { class: 'dancing-script', name: 'Dancing Script' },
      { class: 'hachi-maru-pop', name: 'Hachi Maru Pop' },
      { class: 'lato', name: 'Lato' },
      { class: 'oswald', name: 'Oswald' },
    ],
    toolbarHiddenButtons: [['subscript', 'superscript', 'toggleEditorMode']],
    customClasses: [
      {
        name: 'button-with-link',
        class: 'button-with-link',
        tag: 'a',
        saveHref: true,
      },
    ],
  };
  htmlContent = '';

  constructor(
    private route: Router,
    public activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private blocksAndThemesService: BlocksAndThemesService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = +this.activatedRoute.snapshot.params?.id;
    if (!isNaN(id)) {
      this.blocksAndThemesService
        .getGuide(id)
        .pipe(untilDestroyed(this))
        .subscribe(
          ({ meta }) => {
            this.isReadOnly = true;
            this.htmlContent = meta;
            this.cd.detectChanges();
          },
          () => this.errorRedirect()
        );
    }
  }

  errorRedirect() {
    this.cd.detectChanges();
    this.notificationService.showMessage('error', 'Гайд не найден');
    this.route.navigate(['/themes/manuals']);
  }

  setDialogGetLastManual(lastHTMLManual: string) {
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      hasBackdrop: true,
      data: {
        title: 'Создание статьи',
        content: `Использовать последний черновик`,
        itemName: '',
        confirmButton: 'Использовать',
        declineButton: 'Нет',
      },
    });

    confirmDialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        this.htmlContent = data ? lastHTMLManual : this.htmlContent;
        if (lastHTMLManual) {
          this.metaChanges.emit(this.htmlContent);
        }
        localStorage.removeItem('lastHTMLManual');
        this.cd.detectChanges();
      });
  }

  saveLastManualToStore() {
    if (this.htmlContent && !this.isSaved) {
      localStorage.setItem('lastHTMLManual', JSON.stringify(this.htmlContent));
    }
  }

  ngOnDestroy() {
    this.saveLastManualToStore();
  }

  back() {
    history.back();
  }
}
