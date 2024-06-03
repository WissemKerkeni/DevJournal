import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router'
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { ArticleListItemComponent } from './article-list-item/article-list-item.component';
import { PagerComponent } from '@infordevjournal/ui/components';
import { ArticlesListStore } from '@infordevjournal/articles/data-access';

@Component({
  selector: 'cdt-article-list',
  standalone: true,
  templateUrl: './article-list.component.html',
  imports: [InfiniteScrollDirective, ArticleListItemComponent, PagerComponent, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleListComponent {
  private readonly articlesListStore = inject(ArticlesListStore);
  private readonly router = inject(Router);

  $totalPages = this.articlesListStore.totalPages;
  $articles = this.articlesListStore.articles.entities;
  $listConfig = this.articlesListStore.listConfig;
  $isLoading = this.articlesListStore.getArticlesLoading;

  fakeArticles = Array.from({ length: 4 }, (_, i) => i)

  favorite(slug: string) {
    this.articlesListStore.favouriteArticle(slug);
  }

  unFavorite(slug: string) {
    this.articlesListStore.unFavouriteArticle(slug);
  }

  navigateToArticle(slug: string) {
    this.router.navigate(['/article', slug]);
  }

  onScroll() {
    const nextPage = this.$listConfig().currentPage + 1;
    if (!this.$totalPages().includes(nextPage)) {
      return;
    }
    this.articlesListStore.setListPage(nextPage);
  }
}
