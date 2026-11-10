function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

export function articleHtml(markdown: string) {
  const blocks = markdown.trim().split(/\n\n+/)
  return blocks
    .map((block) => {
      const line = block.trim()
      if (line.startsWith('### ')) return `<h3>${inline(line.slice(4))}</h3>`
      if (line.startsWith('## ')) return `<h2>${inline(line.slice(3))}</h2>`
      if (line.startsWith('# ')) return ''
      return `<p>${inline(line)}</p>`
    })
    .filter(Boolean)
    .join('\n')
}
