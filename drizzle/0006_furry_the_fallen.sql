ALTER TABLE `inquiries` ADD `destinationCity` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `destinationCountry` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `destinationPort` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `estimatedOrderQuantity` int;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `containerRequirement` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `preferredDeliveryPeriod` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `preferredUnits` enum('metric','imperial');--> statement-breakpoint
ALTER TABLE `inquiries` ADD `exportRequirements` text;