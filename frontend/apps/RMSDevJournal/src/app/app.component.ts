import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthStore, LocalStorageJwtService } from '@infordevjournal/auth/data-access';
import { filter, take } from 'rxjs/operators';
import { FooterComponent } from './layout/footer/footer.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { WebSocketService } from '@default/data-access/src';
import { ArticlesListStore } from '@infordevjournal/articles/data-access';
import { Article } from '@infordevjournal/core/api-types';

@Component({
  selector: 'cdt-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [FooterComponent, NavbarComponent, RouterModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly localStorageJwtService = inject(LocalStorageJwtService);
  private readonly authStore = inject(AuthStore);
  private readonly webSocketService = inject(WebSocketService);
  private readonly articlesListStore = inject(ArticlesListStore);

  $user = this.authStore.user;
  $isLoggedIn = this.authStore.loggedIn;

  ngOnInit() {
    this.localStorageJwtService
      .getItem()
      .pipe(
        take(1),
        filter((token) => !!token),
      )
      .subscribe(() => this.authStore.getUser());

    this.webSocketService.onEvent('connection').subscribe(() => {
      console.log('Connected to Socket.IO server');
    });

    this.webSocketService.onEvent<Article[]>('articles').subscribe((articles) => {
      if (!this.authStore.loggedIn() || !articles.length) {
        return;
      }
      console.log('Received articles:', articles);
      const { title, description, body, tagList } = articles[0];
      this.articlesListStore.addArticle({ title, description, body, tagList } as Article);
    });

    // tags
    this.webSocketService.onEvent<string>('tags').subscribe((tag) => {
      if (!this.authStore.loggedIn()) {
        return;
      }
      console.log('Received tag:', tag);
    });

    // comments
    // this.webSocketService.onEvent('comments').subscribe((comments) => {
    //   console.log('Received comments:', comments);
    // });

    // like-unlike
    this.webSocketService.onEvent<Article>('like-unlike').subscribe((article) => {
      if (!this.authStore.loggedIn()) {
        return;
      }
      console.log('Received like-unlike:', article);
    });

    this.webSocketService.onEvent('disconnect').subscribe(() => {
      console.log('Disconnected from Socket.IO server');
    });
  }
}
