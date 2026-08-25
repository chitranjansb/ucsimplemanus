import { beforeEach, describe, expect, it, vi } from "vitest";

const { createInquiryMock } = vi.hoisted(() => ({ createInquiryMock: vi.fn() }));
vi.mock("./db", () => ({ createInquiry: createInquiryMock }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = {
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

describe("inquiries.create", () => {
  beforeEach(() => createInquiryMock.mockReset());

  it("persists a valid inquiry and returns success", async () => {
    createInquiryMock.mockResolvedValueOnce({});
    const result = await appRouter.createCaller(context).inquiries.create({
      name: "Asha & Co",
      email: "asha@example.com",
      project: "Bespoke Projects",
      message: "Need a console for a new space.",
    });
    expect(result).toEqual({ success: true });
    expect(createInquiryMock).toHaveBeenCalledWith({
      name: "Asha & Co",
      email: "asha@example.com",
      project: "Bespoke Projects",
      message: "Need a console for a new space.",
    });
  });

  it("surfaces a database failure for a valid inquiry", async () => {
    createInquiryMock.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(appRouter.createCaller(context).inquiries.create({
      name: "Asha & Co",
      email: "asha@example.com",
      project: "Bespoke Projects",
      message: "Need a console for a new space.",
    })).rejects.toThrow("database unavailable");
  });

  it("rejects incomplete inquiry details", async () => {
    await expect(appRouter.createCaller(context).inquiries.create({
      name: "A",
      email: "not-an-email",
      project: "",
      message: "short",
    })).rejects.toThrow();
    expect(createInquiryMock).not.toHaveBeenCalled();
  });
});
