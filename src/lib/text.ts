/** 把 Markdown 题干压成一行纯文本，用于列表摘要 */
export function plain(text: string, max = 80): string {
  return text
    .replace(/```[\s\S]*?```/g, '［代码］')
    .replace(/[`*#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}
