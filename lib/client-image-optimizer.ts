const MAX_IMAGE_DIMENSION = 2200
const TARGET_FILE_SIZE_BYTES = 5.5 * 1024 * 1024
const MIN_REDUCTION_RATIO = 0.95

function renameWithExtension(fileName: string, extension: string) {
  const dotIndex = fileName.lastIndexOf(".")
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
  return `${base}.${extension}`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = dataUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

async function optimizeImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file
  if (!file.type.startsWith("image/")) return file

  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const largestSide = Math.max(image.width, image.height)
  const resizeRatio = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1
  const targetWidth = Math.max(1, Math.round(image.width * resizeRatio))
  const targetHeight = Math.max(1, Math.round(image.height * resizeRatio))

  if (resizeRatio === 1 && file.size <= TARGET_FILE_SIZE_BYTES) {
    return file
  }

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext("2d")

  if (!context) return file

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const preferredType = file.type === "image/png" ? "image/webp" : "image/jpeg"
  const preferredBlob = await canvasToBlob(canvas, preferredType, 0.92)
  const fallbackBlob = preferredBlob ?? (await canvasToBlob(canvas, file.type, 0.95))

  if (!fallbackBlob) return file
  if (fallbackBlob.size >= file.size * MIN_REDUCTION_RATIO && file.size <= 8 * 1024 * 1024) {
    return file
  }

  const extension = fallbackBlob.type === "image/webp" ? "webp" : "jpg"
  return new File([fallbackBlob], renameWithExtension(file.name, extension), {
    type: fallbackBlob.type,
    lastModified: Date.now(),
  })
}

export async function optimizeImagesForUpload(files: File[]) {
  const optimizedFiles: File[] = []
  let optimizedCount = 0

  for (const file of files) {
    try {
      const optimized = await optimizeImage(file)
      if (optimized !== file) optimizedCount += 1
      optimizedFiles.push(optimized)
    } catch {
      optimizedFiles.push(file)
    }
  }

  return { files: optimizedFiles, optimizedCount }
}
