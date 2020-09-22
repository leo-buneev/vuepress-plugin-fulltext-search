# vuepress-plugin-fulltext-search

Adds full-text search capabilities to your vuepress site with a help of flexsearch library.

Many thanks to [Ahmad Mostafa](https://ahmadmostafa.com/2019/12/09/build-better-search-in-vuepress-site/) for the idea.

## Usage

First, install plugin.

```bash
npm i vuepress-plugin-fulltext-search -D
# or
yarn add -D vuepress-plugin-fulltext-search -D
```

Then, enable the plugin in your `docs/.vuepress/config.js`:

```js
// docs/.vuepress/config.js
module.exports = {
  // ...
  plugins: ['fulltext-search'],
}
```

And that is it! Just compile your app and see for yourself.

Webpack alias `@SearchBox` will be replaced with plugin's implementation, so it should work automatically with any
VuePress theme.

### Functions

You can define functions to hook into various seach features. The functions that can be implemented are as follows:

```ts
/**
 * Augment, adjust, or manipulate the suggestions shown to users.
 */
async function processSuggestions(suggestions: Suggestion[], queryString: string, queryTerms: string[]): Suggestion[]

/**
 * Callback function to call when a user clicks on a suggestion.
 */
async function onGoToSuggestion(index: number, suggestion: Suggestion, queryString: string, queryTerms: string[])
```

Functions are provided to the plugin like so:

```js
const fs = require('fs');
const { path } = require('@vuepress/shared-utils');

module.exports = {
  plugins: [
    ['fulltext-search', {
      // provide the contents of a JavaScript file
      functions: fs.readFileSync(path.resolve(__dirname, 'fulltextSearchFunctions.js')),
    }],
  ]
}
```

For example, in `fulltextSearchFunctions.js`, you might have:

```js
export async function processSuggestions(suggestions, queryString, queryTerms) {
  if (queryString) {
    // add a suggestion to start a search in an external service
    suggestions.push({
      path: 'https://sourcegraph.com/search?patternType=literal&q=',
      slug: queryString,
      parentPageTitle: 'Sourcegraph',
      title: 'Search code',
      contentStr: 'Search for "' + queryString + '" on Sourcegraph',
      external: true,
    });
  }
  return suggestions;
}

export async function onGoToSuggestion() {
  // create an analytics event
}
```

### Search parameters

The `query` URL search parameter can be provided to automatically populate and focus the search box. This is useful for adding your VuePress website as a custom search engine in browsers. For example:

```none
https://your-website.com?query=hello+world
```

### Excluding pages from search

You can exclude pages from search suggestions by adding `search: false` to a page's fontmatter:

```none
---
search: false
---

<!-- page content -->
```
