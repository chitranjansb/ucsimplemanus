CREATE TABLE `inquiry_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`actorUserId` int,
	`actorName` varchar(200),
	`activityType` enum('created','status_changed','assigned','note_added','follow_up_scheduled','quotation_updated') NOT NULL,
	`description` varchar(500) NOT NULL,
	`fromStatus` varchar(40),
	`toStatus` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiry_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inquiries` MODIFY COLUMN `status` enum('new','contacted','follow_up','quotation_sent','negotiation','won','lost','closed') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `inquiries` ADD `quotationValue` decimal(14,2);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `quotationCurrency` varchar(3);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `nextFollowUpAt` timestamp;--> statement-breakpoint
CREATE INDEX `inquiry_activities_inquiry_created_idx` ON `inquiry_activities` (`inquiryId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `inquiry_activities_actor_created_idx` ON `inquiry_activities` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `inquiries_follow_up_idx` ON `inquiries` (`status`,`nextFollowUpAt`);