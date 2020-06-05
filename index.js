const { path } = require('@vuepress/shared-utils')
const htmlToText = require('html-to-text')

module.exports = options => ({
  extendPageData($page) {
    try {
      const { html } = $page._context.markdown.render($page._content)

      const plaintext = htmlToText.fromString(html, {
        wordwrap: null,
        hideLinkHrefIfSameAsText: true,
        ignoreImage: true,
        uppercaseHeadings: false,
      })

      for (const h of $page.headers || []) {
        const titlePlaintext = $page._context.markdown.renderInline(h.title)
        h.charIndex = plaintext.indexOf(titlePlaintext)
        if (h.charIndex === -1) h.charIndex = null
      }
      $page.headersStr = $page.headers ? $page.headers.map(h => h.title).join(' ') : null
      $page.content = plaintext
      $page.contentLowercase = plaintext.toLowerCase()
      $page.charsets = getCharsets(plaintext)
    } catch (e) {
      // incorrect markdown
      console.error('Error when applying fulltext-search plugin:', e)
    }
  },
  alias: {
    '@SearchBox': path.resolve(__dirname, 'components/SearchBox.vue'),
  },
})

function getCharsets(text) {
  const cyrillicRegex = /[\u0400-\u04FF]/iu
  const cjkRegex = /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]|[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/iu

  const result = {}
  if (cyrillicRegex.test(text)) result.cyrillic = true
  if (cjkRegex.test(text)) result.cjk = true
  return result
}
