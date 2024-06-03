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

  fakeTags = [2.625, 2.5, 3, 4.25, 2.75, 3.25, 2.625, 3.5, 3, 2.25, 2.75, 3.25];

  selectTag(tag: string) {
    this.select.emit(tag);
  }
}
