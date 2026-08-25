export const MAX_RAQ_ATTACHMENT_BYTES = 1_500_000;
export const MAX_RAQ_ATTACHMENTS = 3;
export const ACCEPTED_RAQ_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

export type RfqAttachmentPayload = { filename: string; contentType: string; byteSize: number; base64: string };

export function validateRfqFiles(files: File[]) {
  if (files.length > MAX_RAQ_ATTACHMENTS) return "You can attach up to three reference files.";
  for (const file of files) {
    if (!ACCEPTED_RAQ_ATTACHMENT_TYPES.includes(file.type as typeof ACCEPTED_RAQ_ATTACHMENT_TYPES[number])) return `${file.name} is not a supported file type.`;
    if (file.size > MAX_RAQ_ATTACHMENT_BYTES) return `${file.name} is larger than 1.5 MB.`;
  }
  return null;
}

export async function encodeRfqAttachments(files: File[]): Promise<RfqAttachmentPayload[]> {
  return Promise.all(files.map(async (file) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read attachment."));
      reader.onerror = () => reject(new Error("Unable to read attachment."));
      reader.readAsDataURL(file);
    });
    return { filename: file.name, contentType: file.type, byteSize: file.size, base64: dataUrl.split(",")[1] ?? "" };
  }));
}
