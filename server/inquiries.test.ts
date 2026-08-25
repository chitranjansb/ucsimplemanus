import { beforeEach, describe, expect, it, vi } from "vitest";

const { createProjectInquiryMock } = vi.hoisted(() => ({ createProjectInquiryMock: vi.fn() }));
vi.mock("./db", () => ({ createProjectInquiry: createProjectInquiryMock }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = {
  user: null,
  req: { headers: {}, ip: "127.0.0.10" } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

describe("inquiries.create", () => {
  beforeEach(() => createProjectInquiryMock.mockReset());

  it("persists a structured project enquiry with safe defaults and returns its identifier", async () => {
    createProjectInquiryMock.mockResolvedValueOnce({ id: 27 });
    const result = await appRouter.createCaller(context).inquiries.create({
      name: "Asha & Co",
      email: "asha@example.com",
      project: "Bespoke Projects",
      message: "Need a console for a new space.",
      items: [{ productReference: "Carved Storage Cabinet", collectionName: "Mosaic", quantity: 3 }],
    });

    expect(result).toEqual({ success: true, inquiryId: 27 });
    expect(createProjectInquiryMock).toHaveBeenCalledWith({
      inquiry: expect.objectContaining({
        name: "Asha & Co",
        email: "asha@example.com",
        project: "Bespoke Projects",
        message: "Need a console for a new space.",
        company: null,
        metadata: { source: "public_project_enquiry", itemCount: 1, attachmentCount: 0 },
      }),
      items: [{ productReference: "Carved Storage Cabinet", collectionName: "Mosaic", quantity: 3 }],
      attachments: [],
    });
  });

  it("surfaces a database failure for a valid enquiry", async () => {
    createProjectInquiryMock.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(appRouter.createCaller(context).inquiries.create({
      name: "Asha & Co",
      email: "asha@example.com",
      project: "Bespoke Projects",
      message: "Need a console for a new space.",
    })).rejects.toThrow("database unavailable");
  });

  it("silently accepts honeypot submissions without persisting them", async () => {
    const result = await appRouter.createCaller(context).inquiries.create({
      name: "Asha & Co",
      email: "asha@example.com",
      message: "Need a console for a new space.",
      website: "https://spam.invalid",
    });
    expect(result).toEqual({ success: true, inquiryId: null });
    expect(createProjectInquiryMock).not.toHaveBeenCalled();
  });

  it("rejects incomplete or oversized enquiry data before persistence", async () => {
    await expect(appRouter.createCaller(context).inquiries.create({
      name: "A",
      email: "not-an-email",
      project: "",
      message: "short",
    })).rejects.toThrow();
    expect(createProjectInquiryMock).not.toHaveBeenCalled();
  });
});
