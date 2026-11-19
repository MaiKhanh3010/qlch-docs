// Vite gom toàn bộ file Markdown trong content/pages vào bản build.
// Khoá: '/content/pages/<slug>.md' -> nội dung thô của file.
export default import.meta.glob('/content/pages/*.md', { query: '?raw', import: 'default', eager: true });
