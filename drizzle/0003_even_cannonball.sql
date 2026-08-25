CREATE TABLE `catalog_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `catalog_finishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_finishes_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_finishes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `catalog_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_materials_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `catalog_product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`categoryId` int NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_product_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_product_categories_unique` UNIQUE(`productId`,`categoryId`)
);
--> statement-breakpoint
CREATE TABLE `catalog_product_finishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`finishId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_product_finishes_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_product_finishes_unique` UNIQUE(`productId`,`finishId`)
);
--> statement-breakpoint
CREATE TABLE `catalog_product_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`materialId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_product_materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_product_materials_unique` UNIQUE(`productId`,`materialId`)
);
--> statement-breakpoint
CREATE TABLE `catalog_product_specifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`specificationKey` varchar(160) NOT NULL,
	`label` varchar(240) NOT NULL,
	`value` text NOT NULL,
	`unit` varchar(80),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_product_specifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_product_specs_unique` UNIQUE(`productId`,`variantId`,`specificationKey`)
);
--> statement-breakpoint
CREATE TABLE `catalog_product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variantCode` varchar(160) NOT NULL,
	`sku` varchar(160),
	`name` varchar(240),
	`materialId` int,
	`finishId` int,
	`dimensions` text,
	`weightKg` decimal(10,2),
	`moq` int,
	`packagingInfo` text,
	`cbm` decimal(10,3),
	`availability` enum('available','on_request','discontinued') NOT NULL DEFAULT 'on_request',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_product_variants_product_code_unique` UNIQUE(`productId`,`variantCode`),
	CONSTRAINT `catalog_product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `productCode` varchar(160);--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `shortDescription` varchar(500);--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `primaryCategoryId` int;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `weightKg` decimal(10,2);--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `moq` int;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `packagingInfo` text;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `cbm` decimal(10,3);--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `availability` enum('available','on_request','discontinued') DEFAULT 'on_request' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `featured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `isNew` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD CONSTRAINT `catalog_products_product_code_unique` UNIQUE(`productCode`);--> statement-breakpoint
CREATE INDEX `catalog_categories_sort_idx` ON `catalog_categories` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `catalog_product_categories_category_idx` ON `catalog_product_categories` (`categoryId`,`productId`);--> statement-breakpoint
CREATE INDEX `catalog_product_finishes_finish_idx` ON `catalog_product_finishes` (`finishId`,`productId`);--> statement-breakpoint
CREATE INDEX `catalog_product_materials_material_idx` ON `catalog_product_materials` (`materialId`,`productId`);--> statement-breakpoint
CREATE INDEX `catalog_product_specs_product_idx` ON `catalog_product_specifications` (`productId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `catalog_product_specs_variant_idx` ON `catalog_product_specifications` (`variantId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `catalog_product_variants_product_idx` ON `catalog_product_variants` (`productId`);--> statement-breakpoint
CREATE INDEX `catalog_products_category_idx` ON `catalog_products` (`primaryCategoryId`);--> statement-breakpoint
CREATE INDEX `catalog_products_featured_idx` ON `catalog_products` (`status`,`featured`);--> statement-breakpoint
CREATE INDEX `catalog_products_new_idx` ON `catalog_products` (`status`,`isNew`);
--> statement-breakpoint
INSERT INTO `catalog_collections` (`slug`,`name`) VALUES ('stark','Stark'),('flat','Flat'),('toris','Toris'),('rio','Rio'),('urban','Urban'),('mosaic','Mosaic'),('thakat','Thakat'),('patina','Patina'),('sturdy','Sturdy'),('county','County'),('muster','Muster'),('empirical','Empirical'),('bathroom','Bathroom'),('musk','Musk'),('bedroom','Bedroom'),('misty','Misty'),('pulp','Pulp'),('reclaimed','Reclaimed'),('live-edge','Live Edge'),('et','ET') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
--> statement-breakpoint
INSERT INTO `catalog_categories` (`slug`,`name`,`sortOrder`) VALUES ('dining','Dining',10),('living','Living',20),('bedroom','Bedroom',30),('bathroom','Bathroom',40),('outdoor','Outdoor',50),('storage','Storage',60) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`sortOrder`=VALUES(`sortOrder`);
--> statement-breakpoint
INSERT INTO `catalog_materials` (`slug`,`name`) VALUES ('wood-finish-available-on-request','Wood finish available on request') ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
--> statement-breakpoint
INSERT INTO `catalog_products` (`sku`,`productCode`,`slug`,`title`,`shortDescription`,`collectionId`,`primaryCategoryId`,`primaryCategory`,`description`,`materials`,`dimensions`,`status`,`availability`,`customizable`,`featured`,`isNew`,`publishedAt`) VALUES
(NULL,NULL,'carved-storage-cabinet','Carved Storage Cabinet','A cabinet-style reference for a storage enquiry, shown from the Umaid Craftorium collection archive.',(SELECT `id` FROM `catalog_collections` WHERE `slug`='mosaic'),(SELECT `id` FROM `catalog_categories` WHERE `slug`='storage'),'Storage','A cabinet-style reference for a storage enquiry, shown from the Umaid Craftorium collection archive.',JSON_ARRAY('Wood finish available on request'),'Specifications available on request','published','on_request',false,true,false,NOW()),
(NULL,NULL,'accent-side-table','Accent Side Table','A compact occasional furniture reference for living and decorative settings.',(SELECT `id` FROM `catalog_collections` WHERE `slug`='patina'),(SELECT `id` FROM `catalog_categories` WHERE `slug`='living'),'Living','A compact occasional furniture reference for living and decorative settings.',JSON_ARRAY('Wood finish available on request'),'Specifications available on request','published','on_request',false,true,false,NOW()),
(NULL,NULL,'patterned-sideboard','Patterned Sideboard','A sideboard-style storage reference for hospitality, retail, and residential settings.',(SELECT `id` FROM `catalog_collections` WHERE `slug`='stark'),(SELECT `id` FROM `catalog_categories` WHERE `slug`='storage'),'Storage','A sideboard-style storage reference for hospitality, retail, and residential settings.',JSON_ARRAY('Wood finish available on request'),'Specifications available on request','published','on_request',false,true,false,NOW()),
(NULL,NULL,'wooden-chest','Wooden Storage Chest','A chest-style storage reference for a project or collection-sourcing brief.',(SELECT `id` FROM `catalog_collections` WHERE `slug`='county'),(SELECT `id` FROM `catalog_categories` WHERE `slug`='storage'),'Storage','A chest-style storage reference for a project or collection-sourcing brief.',JSON_ARRAY('Wood finish available on request'),'Specifications available on request','published','on_request',false,false,false,NOW()),
(NULL,NULL,'carved-cabinet','Carved Cabinet','A carved cabinet reference for a storage or decorative furniture brief.',(SELECT `id` FROM `catalog_collections` WHERE `slug`='musk'),(SELECT `id` FROM `catalog_categories` WHERE `slug`='storage'),'Storage','A carved cabinet reference for a storage or decorative furniture brief.',JSON_ARRAY('Wood finish available on request'),'Specifications available on request','published','on_request',false,false,false,NOW())
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`),`shortDescription`=VALUES(`shortDescription`),`collectionId`=VALUES(`collectionId`),`primaryCategoryId`=VALUES(`primaryCategoryId`),`primaryCategory`=VALUES(`primaryCategory`),`description`=VALUES(`description`),`materials`=VALUES(`materials`),`dimensions`=VALUES(`dimensions`),`status`=VALUES(`status`),`availability`=VALUES(`availability`),`featured`=VALUES(`featured`),`publishedAt`=VALUES(`publishedAt`);
--> statement-breakpoint
INSERT INTO `catalog_product_categories` (`productId`,`categoryId`,`isPrimary`) SELECT p.`id`,c.`id`,true FROM `catalog_products` p JOIN `catalog_categories` c ON (p.`slug`='carved-storage-cabinet' AND c.`slug`='storage') OR (p.`slug`='accent-side-table' AND c.`slug`='living') OR (p.`slug`='patterned-sideboard' AND c.`slug`='storage') OR (p.`slug`='wooden-chest' AND c.`slug`='storage') OR (p.`slug`='carved-cabinet' AND c.`slug`='storage') ON DUPLICATE KEY UPDATE `isPrimary`=VALUES(`isPrimary`);
--> statement-breakpoint
INSERT INTO `catalog_product_materials` (`productId`,`materialId`,`sortOrder`) SELECT p.`id`,m.`id`,0 FROM `catalog_products` p JOIN `catalog_materials` m ON m.`slug`='wood-finish-available-on-request' WHERE p.`slug` IN ('carved-storage-cabinet','accent-side-table','patterned-sideboard','wooden-chest','carved-cabinet') ON DUPLICATE KEY UPDATE `sortOrder`=VALUES(`sortOrder`);
--> statement-breakpoint
INSERT INTO `catalog_product_images` (`productId`,`storageKey`,`url`,`alt`,`role`,`sortOrder`,`focalDesktopX`,`focalDesktopY`,`focalMobileX`,`focalMobileY`,`fit`,`mobileFit`) SELECT p.`id`,NULL,'/manus-storage/product-cabinet_0372320c.jpg','Carved wooden cabinet from Umaid Craftorium collection imagery','hero',0,50,48,50,44,'contain',NULL FROM `catalog_products` p WHERE p.`slug`='carved-storage-cabinet' AND NOT EXISTS (SELECT 1 FROM `catalog_product_images` i WHERE i.`productId`=p.`id` AND i.`url`='/manus-storage/product-cabinet_0372320c.jpg');
INSERT INTO `catalog_product_images` (`productId`,`storageKey`,`url`,`alt`,`role`,`sortOrder`,`focalDesktopX`,`focalDesktopY`,`focalMobileX`,`focalMobileY`,`fit`,`mobileFit`) SELECT p.`id`,NULL,'/manus-storage/product-console_2e1070d8.jpg','Blue wooden accent table from Umaid Craftorium collection imagery','hero',0,50,48,51,46,'contain',NULL FROM `catalog_products` p WHERE p.`slug`='accent-side-table' AND NOT EXISTS (SELECT 1 FROM `catalog_product_images` i WHERE i.`productId`=p.`id` AND i.`url`='/manus-storage/product-console_2e1070d8.jpg');
INSERT INTO `catalog_product_images` (`productId`,`storageKey`,`url`,`alt`,`role`,`sortOrder`,`focalDesktopX`,`focalDesktopY`,`focalMobileX`,`focalMobileY`,`fit`,`mobileFit`) SELECT p.`id`,NULL,'/manus-storage/product-sideboard_6cf7e491.jpg','Patterned wooden sideboard from Umaid Craftorium collection imagery','hero',0,50,50,50,45,'contain',NULL FROM `catalog_products` p WHERE p.`slug`='patterned-sideboard' AND NOT EXISTS (SELECT 1 FROM `catalog_product_images` i WHERE i.`productId`=p.`id` AND i.`url`='/manus-storage/product-sideboard_6cf7e491.jpg');
INSERT INTO `catalog_product_images` (`productId`,`storageKey`,`url`,`alt`,`role`,`sortOrder`,`focalDesktopX`,`focalDesktopY`,`focalMobileX`,`focalMobileY`,`fit`,`mobileFit`) SELECT p.`id`,NULL,'/manus-storage/product-trunk_6aad3181.jpg','Wooden storage chest from Umaid Craftorium collection imagery','hero',0,50,49,50,45,'contain',NULL FROM `catalog_products` p WHERE p.`slug`='wooden-chest' AND NOT EXISTS (SELECT 1 FROM `catalog_product_images` i WHERE i.`productId`=p.`id` AND i.`url`='/manus-storage/product-trunk_6aad3181.jpg');
INSERT INTO `catalog_product_images` (`productId`,`storageKey`,`url`,`alt`,`role`,`sortOrder`,`focalDesktopX`,`focalDesktopY`,`focalMobileX`,`focalMobileY`,`fit`,`mobileFit`) SELECT p.`id`,NULL,'/manus-storage/product-carved-cabinet_18e101e8.jpg','Carved cabinet from Umaid Craftorium collection imagery','hero',0,50,49,50,45,'contain',NULL FROM `catalog_products` p WHERE p.`slug`='carved-cabinet' AND NOT EXISTS (SELECT 1 FROM `catalog_product_images` i WHERE i.`productId`=p.`id` AND i.`url`='/manus-storage/product-carved-cabinet_18e101e8.jpg');
--> statement-breakpoint
INSERT INTO `catalog_product_specifications` (`productId`,`variantId`,`specificationKey`,`label`,`value`,`unit`,`sortOrder`) SELECT p.`id`,NULL,'dimensions','Dimensions','Specifications available on request',NULL,0 FROM `catalog_products` p WHERE p.`slug` IN ('carved-storage-cabinet','accent-side-table','patterned-sideboard','wooden-chest','carved-cabinet') AND NOT EXISTS (SELECT 1 FROM `catalog_product_specifications` s WHERE s.`productId`=p.`id` AND s.`variantId` IS NULL AND s.`specificationKey`='dimensions');
