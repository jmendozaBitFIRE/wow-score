// Extrae el texto plano de un guion subido, sea cual sea su formato.
// Cada parser corre server-side sobre un archivo que subió el usuario — se
// envuelve el resultado, pero un archivo corrupto/malicioso no debe tumbar
// la request completa (el caller atrapa el throw y responde con un 500 claro).

const SCRIPT_EXTENSIONS = ['txt', 'pdf', 'docx', 'doc'] as const
export type ScriptExtension = typeof SCRIPT_EXTENSIONS[number]

export function getScriptExtension(filePathOrUrl: string): ScriptExtension | null {
  const withoutQuery = filePathOrUrl.split(/[?#]/)[0]
  const match = withoutQuery.toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = match?.[1]
  return (SCRIPT_EXTENSIONS as readonly string[]).includes(ext ?? '') ? (ext as ScriptExtension) : null
}

export async function extractScriptText(buffer: Buffer, extension: ScriptExtension): Promise<string> {
  switch (extension) {
    case 'txt':
      return buffer.toString('utf-8')

    case 'pdf': {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: buffer })
      try {
        const result = await parser.getText()
        return result.text
      } finally {
        await parser.destroy()
      }
    }

    case 'docx': {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }

    case 'doc': {
      const WordExtractor = (await import('word-extractor')).default
      const doc = await new WordExtractor().extract(buffer)
      return doc.getBody()
    }
  }
}
