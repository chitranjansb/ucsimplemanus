import { z } from "zod";

export const internationalRfqFieldsSchema = z.object({
  destinationCity: z.string().trim().max(160).optional(),
  destinationCountry: z.string().trim().max(160).optional(),
  destinationPort: z.string().trim().max(160).optional(),
  estimatedOrderQuantity: z.number().int().min(1).max(1_000_000).optional(),
  containerRequirement: z.string().trim().max(160).optional(),
  preferredDeliveryPeriod: z.string().trim().max(160).optional(),
  preferredUnits: z.enum(["metric", "imperial"]).optional(),
  exportRequirements: z.string().trim().max(3000).optional(),
});

export type InternationalRfqFields = z.infer<typeof internationalRfqFieldsSchema>;
