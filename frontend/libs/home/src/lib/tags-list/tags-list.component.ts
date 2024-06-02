import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';

@Component({
  selector: 'cdt-tags-list',
  standalone: true,
  templateUrl: './tags-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsListComponent {
  tags = input([]);
  select = output<string>();
  selectedTag = input([]);

  selectTag(tag: string) {
    this.select.emit(tag);
  }
}
