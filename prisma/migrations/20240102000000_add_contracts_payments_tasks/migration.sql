-- AddContractPaymentTask: contracts, payments, client_tasks tables

CREATE TABLE `Contract` (
  `id` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE','EXPIRED','CANCELLED','PENDING') NOT NULL DEFAULT 'ACTIVE',
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NULL,
  `documentUrl` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  `status` ENUM('PAID','UNPAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'UNPAID',
  `dueDate` DATETIME(3) NOT NULL,
  `paidAt` DATETIME(3) NULL,
  `invoiceUrl` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClientTask` (
  `id` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `link` VARCHAR(191) NULL,
  `linkLabel` VARCHAR(191) NULL,
  `dueDate` DATETIME(3) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Contract` ADD CONSTRAINT `Contract_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ClientTask` ADD CONSTRAINT `ClientTask_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX `Contract_clientId_idx` ON `Contract`(`clientId`);
CREATE INDEX `Contract_status_idx` ON `Contract`(`status`);
CREATE INDEX `Payment_clientId_idx` ON `Payment`(`clientId`);
CREATE INDEX `Payment_status_idx` ON `Payment`(`status`);
CREATE INDEX `Payment_dueDate_idx` ON `Payment`(`dueDate`);
CREATE INDEX `ClientTask_clientId_idx` ON `ClientTask`(`clientId`);
CREATE INDEX `ClientTask_status_idx` ON `ClientTask`(`status`);
