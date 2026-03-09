CREATE TABLE `scan_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scannedCode` varchar(512) NOT NULL,
	`resolvedType` varchar(64),
	`hubspotId` varchar(64),
	`displayName` varchar(256),
	`action` enum('view','receive','checkin') NOT NULL DEFAULT 'view',
	`success` int NOT NULL DEFAULT 1,
	`note` text,
	`userId` int,
	`scannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_history_id` PRIMARY KEY(`id`)
);
