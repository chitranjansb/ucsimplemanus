CREATE TABLE `catalog_product_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(240) NOT NULL,
	`documentType` varchar(120) NOT NULL,
	`storageKey` varchar(512),
	`url` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_product_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalog_product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`storageKey` varchar(512),
	`url` text NOT NULL,
	`alt` varchar(400),
	`role` enum('hero','gallery','detail') NOT NULL DEFAULT 'gallery',
	`sortOrder` int NOT NULL DEFAULT 0,
	`focalDesktopX` int,
	`focalDesktopY` int,
	`focalMobileX` int,
	`focalMobileY` int,
	`fit` enum('contain','cover') NOT NULL DEFAULT 'contain',
	`mobileFit` enum('contain','cover'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalog_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(160),
	`slug` varchar(180) NOT NULL,
	`title` varchar(240) NOT NULL,
	`collectionId` int,
	`primaryCategory` varchar(160),
	`description` text,
	`materials` json,
	`finishes` json,
	`dimensions` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`customizable` boolean NOT NULL DEFAULT false,
	`seoTitle` varchar(255),
	`seoDescription` varchar(320),
	`metadata` json,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_products_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `catalog_products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `catalog_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`seoTitle` varchar(255),
	`seoDescription` varchar(320),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_collections_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `inquiry_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`filename` varchar(240) NOT NULL,
	`contentType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiry_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiry_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`productId` int,
	`productReference` varchar(240) NOT NULL,
	`collectionName` varchar(200),
	`quantity` int NOT NULL DEFAULT 1,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiry_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inquiries` ADD `company` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `phone` varchar(80);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `buyerType` varchar(120);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `projectType` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `shippingCountry` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `targetMarket` varchar(160);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `timeline` varchar(120);--> statement-breakpoint
ALTER TABLE `inquiries` ADD `customizationRequirements` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `metadata` json;--> statement-breakpoint
CREATE INDEX `catalog_product_documents_product_idx` ON `catalog_product_documents` (`productId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `catalog_product_images_product_idx` ON `catalog_product_images` (`productId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `catalog_products_collection_idx` ON `catalog_products` (`collectionId`);--> statement-breakpoint
CREATE INDEX `catalog_products_status_idx` ON `catalog_products` (`status`);--> statement-breakpoint
CREATE INDEX `inquiry_attachments_inquiry_idx` ON `inquiry_attachments` (`inquiryId`);--> statement-breakpoint
CREATE INDEX `inquiry_items_inquiry_idx` ON `inquiry_items` (`inquiryId`);