import { describe, it, expect, vi } from 'vitest'

const state = vi.hoisted(() => ({
  pdfText: 'texto del pdf',
  mammothText: 'texto del docx',
  docText: 'texto del doc',
  pdfDestroyed: false,
}))

vi.mock('pdf-parse', () => ({
  PDFParse: class {
    constructor(public options: { data: Buffer }) {}
    async getText() {
      return { text: state.pdfText }
    }
    async destroy() {
      state.pdfDestroyed = true
    }
  },
}))

vi.mock('mammoth', () => ({
  extractRawText: async ({ buffer }: { buffer: Buffer }) => ({ value: `${state.mammothText}:${buffer.length}` }),
}))

vi.mock('word-extractor', () => ({
  default: class {
    async extract() {
      return { getBody: () => state.docText }
    }
  },
}))

const { getScriptExtension, extractScriptText } = await import('../extract-text')

describe('getScriptExtension', () => {
  it('reconoce txt, pdf, docx y doc (sin importar mayúsculas)', () => {
    expect(getScriptExtension('guion.txt')).toBe('txt')
    expect(getScriptExtension('guion.PDF')).toBe('pdf')
    expect(getScriptExtension('carpeta/guion.docx')).toBe('docx')
    expect(getScriptExtension('guion.DOC')).toBe('doc')
  })

  it('ignora query string y hash al final de una URL firmada', () => {
    expect(getScriptExtension('https://x.supabase.co/.../guion.pdf?token=abc')).toBe('pdf')
    expect(getScriptExtension('https://x.supabase.co/.../guion.txt#frag')).toBe('txt')
  })

  it('devuelve null para imágenes u otras extensiones', () => {
    expect(getScriptExtension('anuncio.png')).toBeNull()
    expect(getScriptExtension('anuncio.jpg')).toBeNull()
    expect(getScriptExtension('sin-extension')).toBeNull()
  })
})

describe('extractScriptText', () => {
  it('txt: decodifica el buffer directo como UTF-8', async () => {
    const result = await extractScriptText(Buffer.from('hola guion', 'utf-8'), 'txt')
    expect(result).toBe('hola guion')
  })

  it('pdf: usa PDFParse y cierra el parser', async () => {
    state.pdfDestroyed = false
    const result = await extractScriptText(Buffer.from('fake-pdf'), 'pdf')
    expect(result).toBe('texto del pdf')
    expect(state.pdfDestroyed).toBe(true)
  })

  it('docx: usa mammoth.extractRawText con el buffer', async () => {
    const buf = Buffer.from('fake-docx')
    const result = await extractScriptText(buf, 'docx')
    expect(result).toBe(`texto del docx:${buf.length}`)
  })

  it('doc: usa WordExtractor y getBody()', async () => {
    const result = await extractScriptText(Buffer.from('fake-doc'), 'doc')
    expect(result).toBe('texto del doc')
  })
})
