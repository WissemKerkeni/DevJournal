import { Article } from '@infordevjournal/core/api-types';

export interface ArticlesListState {
  listConfig: ArticlesListConfig;
  articles: Articles;
}

export interface ArticlesListConfig {
  type: ListType;
  currentPage: number;
  filters: Filters;
  loadMore: boolean;
}

export interface Filters {
  title?: string;
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export type ListType = 'ALL' | 'FEED';

export interface Articles {
  entities: Article[];
  articlesCount: number;
}

export const articlesListInitialState: ArticlesListState = {
  listConfig: {
    type: 'ALL',
    currentPage: 1,
    filters: {
      limit: 10,
    },
    loadMore: false,
  },
  articles: {
    entities: [],
    articlesCount: 0,
  },
};
