import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cell-content',
  templateUrl: './cell-content.component.html',
  styleUrls: ['./cell-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellContentComponent {
  @ViewChild('eyeElement') public eyeElement;
  @ViewChild('userLinkElement') public userLinkElement;
  @ViewChild('actionsElement') public actionsElement;
  @ViewChild('itemsContainer') public itemsContainer;
  @ViewChild('commentElement') public commentElement;

  @Input()
  cellBlock;

  calculateCell(callback, item, items = []) {
    return callback(item, items);
  }
  cellTemplate(content, item, items = []) {
    if (content?.templateCalculated) {
      content.template = this.calculateCell(content?.templateCalculated, item, items);
    }
    return content?.template || undefined;
  }
  cellTemplateContext(content, item, items = []) {
    if (content?.contextCalculated) {
      content.context = this.calculateCell(content?.contextCalculated, item, items);
    }
    return content?.context || undefined;
  }
  trackByIdentity = (index: number, item: any) => item.id;
}
