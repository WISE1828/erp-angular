import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FinancesService } from '../../../finances/finances.service';

@UntilDestroy()
@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent implements OnInit {
  form: FormGroup;
  private body = {};
  @Input() termId: number;
  @Input() text: string;
  @Input() name: string;
  @Input() isSaveExternal: boolean = false;
  @Input() disable: boolean = false;
  @Output() hideComment: EventEmitter<any> = new EventEmitter();
  @Output() saveComment: EventEmitter<any> = new EventEmitter();
  @ViewChild('textarea') textareaEl: ElementRef<HTMLTextAreaElement>;
  constructor(
    private financesService: FinancesService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.text = localStorage.getItem(this.name) || this.text;
    this.form = new FormGroup({
      comment: new FormControl(this.text, [Validators.required]),
    });
  }

  public submit(): void {
    this.body[this.name] = this.form.get('comment').value;
    if (this.isSaveExternal) {
      this.saveComment.emit(this.body[this.name]);
      this.hideComment.emit();
      return;
    }
    this.financesService
      .updateComments(this.body, this.termId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.financesService
            .getTaxAndComments(this.termId)
            .pipe(untilDestroyed(this))
            .subscribe(response => {
              localStorage.setItem('comissionComment', response['comissionComment']);
              localStorage.setItem('accountComment', response['accountComment']);
              this.hideComment.emit();
              this.cd.detectChanges();
            });
        },
        () => {
          this.notificationService.showMessage('error', 'При обновлении комментария произошла ошибка');
          this.cd.detectChanges();
        }
      );
  }

  public onClickedOutside(target): void {
    if ((document.getSelection()?.focusNode as HTMLElement)?.classList?.value?.includes('comment')) {
      return;
    }
    if (!target.classList.contains('comment')) {
      this.hideComment.emit();
    }
  }
}
