import React, { useState, useRef, useCallback } from 'react'

const ACCEPTED = ['.pdf', '.xlsx', '.docx', '.csv', '.xls']
const ACCEPT_ATTR = ACCEPTED.join(',')

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  file: string
  status: UploadStatus
  message: string
}

function FileIcon({ ext }: { ext: string }) {
  const colors: Record<string, string> = {
    pdf: 'text-red-400',
    xlsx: 'text-emerald-400',
    xls: 'text-emerald-400',
    docx: 'text-blue-400',
    csv: 'text-yellow-400',
  }
  const color = colors[ext.toLowerCase()] ?? 'text-gray-400'
  return (
    <svg className={`w-8 h-8 ${color}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
    </svg>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Ingest() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<UploadResult[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return ACCEPTED.includes(ext)
    })
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))]
    })
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResults(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadAll = async () => {
    if (!files.length || uploading) return
    setUploading(true)
    setResults(files.map(f => ({ file: f.name, status: 'uploading', message: 'Uploading...' })))

    const settled = await Promise.allSettled(
      files.map(async (file, idx) => {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('http://localhost:3000/api/ingest/file', {
          method: 'POST',
          body: form,
        })
        const data = await res.json().catch(() => ({}))
        return { idx, ok: res.ok, data }
      }),
    )

    setResults(
      settled.map((r, idx) => {
        if (r.status === 'fulfilled') {
          const { ok, data } = r.value
          return {
            file: files[idx].name,
            status: ok ? 'success' : 'error',
            message: ok
              ? data?.message ?? 'Ingested successfully.'
              : data?.error ?? data?.message ?? 'Upload failed.',
          }
        }
        return {
          file: files[idx].name,
          status: 'error',
          message: (r as PromiseRejectedResult).reason?.message ?? 'Network error.',
        }
      }),
    )
    setUploading(false)
  }

  const clearAll = () => {
    setFiles([])
    setResults([])
  }

  const allDone = results.length > 0 && results.every(r => r.status !== 'uploading')

  return (
    <div className="flex flex-col h-full bg-[#212121] text-white">
      {/* Header */}
      <header className="flex items-center justify-center h-14 border-b border-white/10 shrink-0">
        <span className="text-base font-semibold text-gray-200 tracking-wide">File Ingest</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-14 px-6 cursor-pointer transition-colors select-none ${
              dragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/20 bg-[#2a2a2a] hover:border-white/30 hover:bg-[#2f2f2f]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-6-9l-3 3h2v4h2v-4h2l-3-3z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-200">
                Drag &amp; drop files here, or <span className="text-emerald-400">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported: {ACCEPTED.join(', ')}
              </p>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {files.map((file, idx) => {
                const ext = file.name.split('.').pop() ?? ''
                const result = results[idx]
                return (
                  <div
                    key={file.name + file.size}
                    className="flex items-center gap-3 bg-[#2a2a2a] rounded-xl px-4 py-3 border border-white/10"
                  >
                    <FileIcon ext={ext} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                      {result && (
                        <p
                          className={`text-xs mt-0.5 ${
                            result.status === 'success'
                              ? 'text-emerald-400'
                              : result.status === 'error'
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {result.message}
                        </p>
                      )}
                    </div>

                    {/* Status icon or remove */}
                    {result?.status === 'uploading' ? (
                      <svg className="w-4 h-4 text-gray-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : result?.status === 'success' ? (
                      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    ) : result?.status === 'error' ? (
                      <svg className="w-5 h-5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    ) : (
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          {files.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={uploadAll}
                disabled={uploading || allDone}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  uploading || allDone
                    ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {uploading
                  ? 'Uploading...'
                  : allDone
                  ? 'Done'
                  : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
              </button>
              {allDone && (
                <button
                  onClick={clearAll}
                  className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#2f2f2f] hover:bg-[#3a3a3a] text-gray-200 transition-colors border border-white/10"
                >
                  Upload more
                </button>
              )}
            </div>
          )}

          {/* Empty hint */}
          {files.length === 0 && (
            <div className="text-center text-xs text-gray-600">
              Files are sent to{' '}
              <code className="text-gray-500 bg-white/5 px-1 rounded">
                POST /api/ingest/file
              </code>{' '}
              as <code className="text-gray-500 bg-white/5 px-1 rounded">multipart/form-data</code>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
