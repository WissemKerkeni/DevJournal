import { Article, User } from '@infordevjournal/core/api-types';
import { DynamicFormComponent, Field, ListErrorsComponent } from '@infordevjournal/core/forms';
import { ChangeDetectionStrategy, Component, Input, input, output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'cdt-add-comment',
  standalone: true,
  templateUrl: './add-comment.component.html',
  imports: [ListErrorsComponent, DynamicFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCommentComponent {
  article = input.required<Article>();
  currentUser = input.required<User>();
  isLoading = input.required<boolean>();
  @Input() data$!: Observable<any>;
  @Input() structure$!: Observable<Field[]>;
  @Input() touchedForm$!: Observable<boolean>;
  submitComment = output<string>();
  updateForm = output<string>();
}
