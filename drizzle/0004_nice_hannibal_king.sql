CREATE TABLE `inquiry_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`authorName` varchar(200),
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiry_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`filename` varchar(240) NOT NULL,
	`contentType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`alt` varchar(400),
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_storage_key_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentKey` varchar(120) NOT NULL,
	`body` text NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_content_key_unique` UNIQUE(`contentKey`)
);
--> statement-breakpoint
ALTER TABLE `catalog_categories` ADD `status` enum('active','archived') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_product_images` ADD `mediaAssetId` int;--> statement-breakpoint
ALTER TABLE `catalog_collections` ADD `heroMediaId` int;--> statement-breakpoint
ALTER TABLE `catalog_collections` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_collections` ADD `status` enum('active','archived') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `assignedToUserId` int;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE INDEX `inquiry_notes_inquiry_created_idx` ON `inquiry_notes` (`inquiryId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `media_assets_status_created_idx` ON `media_assets` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `catalog_categories_status_sort_idx` ON `catalog_categories` (`status`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `catalog_collections_status_sort_idx` ON `catalog_collections` (`status`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `inquiries_status_created_idx` ON `inquiries` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `inquiries_assigned_created_idx` ON `inquiries` (`assignedToUserId`,`createdAt`);