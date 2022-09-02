module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const replacements = [
    { from: 'solid-query', to: '@tanstack/solid-query' },
    { from: 'solid-query/devtools', to: '@tanstack/solid-query-devtools' },
  ]

  replacements.forEach(({ from, to }) => {
    root
      .find(jscodeshift.ImportDeclaration, {
        source: {
          value: from,
        },
      })
      .replaceWith(({ node }) => {
        node.source.value = to

        return node
      })
  })

  return root.toSource({ quote: 'single' })
}
