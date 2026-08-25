import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createProjectInquiry } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const MAX_ATTACHMENT_BYTES = 1_500_000;
const MAX_ATTACHMENTS = 3;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ENQUIRIES_PER_WINDOW = 6;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const enquiryRateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const firstForwarded = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;
  return firstForwarded || req.ip || req.socket?.remoteAddress || "unknown";
}

function enforceEnquiryRateLimit(ip: string) {
  const now = Date.now();
  for (const [key, bucket] of Array.from(enquiryRateBuckets.entries())) if (bucket.resetAt < now) enquiryRateBuckets.delete(key);
  const bucket = enquiryRateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    enquiryRateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  if (bucket.count >= MAX_ENQUIRIES_PER_WINDOW) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many enquiries. Please try again later." });
  bucket.count += 1;
}

function safeFilename(filename: string) {
  const basename = filename.replace(/\\/g, "/").split("/").pop()?.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  if (!basename || basename === "." || basename === "..") throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid attachment filename." });
  return basename;
}

function decodeAttachment(data: string, declaredSize: number) {
  const normalized = data.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid attachment encoding." });
  const bytes = Buffer.from(normalized, "base64");
  if (bytes.byteLength !== declaredSize || bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Attachment exceeds the allowed size." });
  return bytes;
}

const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().max(120),
  byteSize: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
  base64: z.string().min(4).max(2_100_000),
});

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(80).optional(),
  buyerType: z.string().trim().max(120).optional(),
  project: z.string().trim().min(2).max(160).optional(),
  projectType: z.string().trim().max(160).optional(),
  shippingCountry: z.string().trim().max(160).optional(),
  targetMarket: z.string().trim().max(160).optional(),
  timeline: z.string().trim().max(120).optional(),
  customizationRequirements: z.string().trim().max(3000).optional(),
  message: z.string().trim().min(10).max(5000),
  items: z.array(z.object({ productReference: z.string().trim().min(1).max(240), collectionName: z.string().trim().max(200).optional(), quantity: z.number().int().min(1).max(500) })).max(24).default([]),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).default([]),
  submittedAt: z.number().int().positive().optional(),
  website: z.string().max(200).optional().default(""),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  inquiries: router({
    create: publicProcedure.input(enquirySchema).mutation(async ({ input, ctx }) => {
      if (input.website.trim()) return { success: true, inquiryId: null } as const;
      if (input.submittedAt) {
        const formAge = Date.now() - input.submittedAt;
        if (formAge < 1200 || formAge > 24 * 60 * 60 * 1000) throw new TRPCError({ code: "BAD_REQUEST", message: "Please reopen the enquiry form and try again." });
      }
      enforceEnquiryRateLimit(clientIp(ctx.req));

      const uploadedAttachments = [] as { storageKey: string; filename: string; contentType: string; byteSize: number }[];
      const uploadNamespace = `inquiries/${crypto.randomUUID()}`;
      for (const attachment of input.attachments) {
        if (!ALLOWED_ATTACHMENT_TYPES.has(attachment.contentType)) throw new TRPCError({ code: "BAD_REQUEST", message: "This attachment type is not supported." });
        const filename = safeFilename(attachment.filename);
        const bytes = decodeAttachment(attachment.base64, attachment.byteSize);
        const stored = await storagePut(`${uploadNamespace}/${filename}`, bytes, attachment.contentType);
        uploadedAttachments.push({ storageKey: stored.key, filename, contentType: attachment.contentType, byteSize: bytes.byteLength });
      }

      const project = input.project || [input.buyerType, input.projectType, input.shippingCountry].filter(Boolean).join(" · ") || "Project enquiry";
      const created = await createProjectInquiry({
        inquiry: {
          name: input.name,
          email: input.email,
          company: input.company || null,
          phone: input.phone || null,
          buyerType: input.buyerType || null,
          project,
          projectType: input.projectType || null,
          shippingCountry: input.shippingCountry || null,
          targetMarket: input.targetMarket || null,
          timeline: input.timeline || null,
          customizationRequirements: input.customizationRequirements || null,
          message: input.message,
          metadata: { source: "public_project_enquiry", itemCount: input.items.length, attachmentCount: uploadedAttachments.length },
        },
        items: input.items,
        attachments: uploadedAttachments,
      });
      return { success: true, inquiryId: created.id } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
