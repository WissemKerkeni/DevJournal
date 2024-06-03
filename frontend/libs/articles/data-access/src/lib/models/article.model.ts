import { Article, Comment } from '@infordevjournal/core/api-types';

export interface ArticleState {
  data: Article;
  comments: Comment[];
  addArticleLoading: boolean;
  addCommentLoading: boolean;
}

export const articleInitialState: ArticleState = {
  data: {
    slug: '',
    title: '',
    description: '',
    body: '',
    tagList: [],
    createdAt: '',
    updatedAt: '',
    favorited: false,
    favoritesCount: 0,
    author: {
      username: '',
      bio: '',
      image: '',
      following: false,
      loading: false,
    },
  },
  comments: [],
  addArticleLoading: false,
  addCommentLoading: false,
};
