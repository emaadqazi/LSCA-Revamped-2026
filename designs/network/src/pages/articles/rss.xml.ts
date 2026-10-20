import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getArticles } from '../../lib/content';
import { SITE } from '../../lib/site';

export async function GET(context: APIContext) {
  const articles = await getArticles();
  return rss({
    title: 'LSCA articles',
    description: 'Writing from Laurier Supply Chain Association members.',
    site: context.site ?? SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.date,
      description: a.data.excerpt,
      author: a.data.author,
      link: `/articles/${a.id}/`,
    })),
  });
}
