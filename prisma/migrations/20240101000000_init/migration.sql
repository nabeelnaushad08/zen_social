-- ZenSocial — Initial Migration
-- MySQL / PlanetScale compatible
-- Generated for Prisma 5

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES (dependency order: no FKs inline — added via ALTER TABLE at the end)
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable User
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN','CLIENT') NOT NULL DEFAULT 'CLIENT',
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Session
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_token_key`(`token`),
    INDEX `Session_token_idx`(`token`),
    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Niche
CREATE TABLE `Niche` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `iconUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Niche_name_key`(`name`),
    UNIQUE INDEX `Niche_slug_key`(`slug`),
    INDEX `Niche_slug_idx`(`slug`),
    INDEX `Niche_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Package
CREATE TABLE `Package` (
    `id` VARCHAR(191) NOT NULL,
    `nicheId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `monthlyPostLimit` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Package_slug_key`(`slug`),
    INDEX `Package_nicheId_idx`(`nicheId`),
    INDEX `Package_slug_idx`(`slug`),
    INDEX `Package_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable PackageCategory
CREATE TABLE `PackageCategory` (
    `id` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contentType` ENUM('BANNER','VIDEO','STORY','REEL','CAROUSEL','SOCIAL_PROOF','INFOGRAPHIC') NOT NULL,
    `monthlyLimit` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PackageCategory_packageId_idx`(`packageId`),
    INDEX `PackageCategory_contentType_idx`(`contentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Platform
CREATE TABLE `Platform` (
    `id` VARCHAR(191) NOT NULL,
    `slug` ENUM('FACEBOOK','INSTAGRAM','LINKEDIN','GOOGLE_MY_BUSINESS','TWITTER_X','PINTEREST','TIKTOK','YOUTUBE','TRIPADVISOR','LINKTREE','BLUESKY') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `iconUrl` VARCHAR(191) NULL,
    `aspectRatio` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Platform_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Media
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `cloudinaryId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `secureUrl` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration` DOUBLE NULL,
    `bytes` INTEGER NOT NULL,
    `folder` VARCHAR(191) NULL,
    `altText` VARCHAR(191) NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Media_cloudinaryId_key`(`cloudinaryId`),
    INDEX `Media_cloudinaryId_idx`(`cloudinaryId`),
    INDEX `Media_folder_idx`(`folder`),
    INDEX `Media_resourceType_idx`(`resourceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Client
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nicheId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NULL,
    `secondaryColor` VARCHAR(191) NULL,
    `tagline` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `onboardedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_userId_key`(`userId`),
    UNIQUE INDEX `Client_slug_key`(`slug`),
    INDEX `Client_nicheId_idx`(`nicheId`),
    INDEX `Client_packageId_idx`(`packageId`),
    INDEX `Client_slug_idx`(`slug`),
    INDEX `Client_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ContentTemplate
CREATE TABLE `ContentTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `nicheId` VARCHAR(191) NULL,
    `packageCategoryId` VARCHAR(191) NULL,
    `mediaId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `contentType` ENUM('BANNER','VIDEO','STORY','REEL','CAROUSEL','SOCIAL_PROOF','INFOGRAPHIC') NOT NULL,
    `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `thumbnailUrl` VARCHAR(191) NULL,
    `defaultTagline` VARCHAR(191) NULL,
    `defaultCaption` LONGTEXT NULL,
    `defaultCta` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentTemplate_nicheId_idx`(`nicheId`),
    INDEX `ContentTemplate_packageCategoryId_idx`(`packageCategoryId`),
    INDEX `ContentTemplate_contentType_idx`(`contentType`),
    INDEX `ContentTemplate_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ContentTemplatePlatform
CREATE TABLE `ContentTemplatePlatform` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `platformId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ContentTemplatePlatform_templateId_platformId_key`(`templateId`, `platformId`),
    INDEX `ContentTemplatePlatform_templateId_idx`(`templateId`),
    INDEX `ContentTemplatePlatform_platformId_idx`(`platformId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable MonthlyBatch
CREATE TABLE `MonthlyBatch` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `notes` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonthlyBatch_clientId_month_year_key`(`clientId`, `month`, `year`),
    INDEX `MonthlyBatch_clientId_idx`(`clientId`),
    INDEX `MonthlyBatch_status_idx`(`status`),
    INDEX `MonthlyBatch_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable MonthlyContentItem
CREATE TABLE `MonthlyContentItem` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `tagline` VARCHAR(191) NULL,
    `caption` LONGTEXT NULL,
    `cta` VARCHAR(191) NULL,
    `approvalStatus` ENUM('PENDING','APPROVED','REVISION_REQUESTED') NOT NULL DEFAULT 'PENDING',
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MonthlyContentItem_batchId_idx`(`batchId`),
    INDEX `MonthlyContentItem_templateId_idx`(`templateId`),
    INDEX `MonthlyContentItem_approvalStatus_idx`(`approvalStatus`),
    INDEX `MonthlyContentItem_isLocked_idx`(`isLocked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable MonthlyContentPlatform
CREATE TABLE `MonthlyContentPlatform` (
    `id` VARCHAR(191) NOT NULL,
    `contentItemId` VARCHAR(191) NOT NULL,
    `platformId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MonthlyContentPlatform_contentItemId_platformId_key`(`contentItemId`, `platformId`),
    INDEX `MonthlyContentPlatform_contentItemId_idx`(`contentItemId`),
    INDEX `MonthlyContentPlatform_platformId_idx`(`platformId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ContentPlatformCaption
CREATE TABLE `ContentPlatformCaption` (
    `id` VARCHAR(191) NOT NULL,
    `contentItemId` VARCHAR(191) NOT NULL,
    `platformId` VARCHAR(191) NOT NULL,
    `caption` LONGTEXT NOT NULL,
    `hashtags` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContentPlatformCaption_contentItemId_platformId_key`(`contentItemId`, `platformId`),
    INDEX `ContentPlatformCaption_contentItemId_idx`(`contentItemId`),
    INDEX `ContentPlatformCaption_platformId_idx`(`platformId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Approval
CREATE TABLE `Approval` (
    `id` VARCHAR(191) NOT NULL,
    `contentItemId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING','APPROVED','REVISION_REQUESTED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `approvedByIp` VARCHAR(191) NULL,
    `revisionNote` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Approval_contentItemId_key`(`contentItemId`),
    INDEX `Approval_status_idx`(`status`),
    INDEX `Approval_contentItemId_idx`(`contentItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable DesignRequest
CREATE TABLE `DesignRequest` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `contentItemId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING','IN_PROGRESS','COMPLETED','REJECTED') NOT NULL DEFAULT 'PENDING',
    `comment` LONGTEXT NOT NULL,
    `adminNote` LONGTEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DesignRequest_clientId_idx`(`clientId`),
    INDEX `DesignRequest_contentItemId_idx`(`contentItemId`),
    INDEX `DesignRequest_status_idx`(`status`),
    INDEX `DesignRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable DesignRequestAsset
CREATE TABLE `DesignRequestAsset` (
    `id` VARCHAR(191) NOT NULL,
    `designRequestId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DesignRequestAsset_designRequestId_idx`(`designRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable TextEditHistory
CREATE TABLE `TextEditHistory` (
    `id` VARCHAR(191) NOT NULL,
    `contentItemId` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `oldValue` LONGTEXT NULL,
    `newValue` LONGTEXT NULL,
    `editedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TextEditHistory_contentItemId_idx`(`contentItemId`),
    INDEX `TextEditHistory_editedAt_idx`(`editedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Feedback
CREATE TABLE `Feedback` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` LONGTEXT NOT NULL,
    `rating` INTEGER NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `adminResponse` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Feedback_clientId_idx`(`clientId`),
    INDEX `Feedback_isRead_idx`(`isRead`),
    INDEX `Feedback_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Notification
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('BATCH_PUBLISHED','CONTENT_APPROVED','DESIGN_REQUEST_UPDATED','DESIGN_REQUEST_COMPLETED','FEEDBACK_RECEIVED','SYSTEM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable AuditLog
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- FOREIGN KEYS
-- ─────────────────────────────────────────────────────────────────────────────

-- AddForeignKey Session → User
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Client → User
ALTER TABLE `Client` ADD CONSTRAINT `Client_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Client → Niche
ALTER TABLE `Client` ADD CONSTRAINT `Client_nicheId_fkey`
    FOREIGN KEY (`nicheId`) REFERENCES `Niche`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Client → Package
ALTER TABLE `Client` ADD CONSTRAINT `Client_packageId_fkey`
    FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Package → Niche
ALTER TABLE `Package` ADD CONSTRAINT `Package_nicheId_fkey`
    FOREIGN KEY (`nicheId`) REFERENCES `Niche`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey PackageCategory → Package
ALTER TABLE `PackageCategory` ADD CONSTRAINT `PackageCategory_packageId_fkey`
    FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ContentTemplate → Niche
ALTER TABLE `ContentTemplate` ADD CONSTRAINT `ContentTemplate_nicheId_fkey`
    FOREIGN KEY (`nicheId`) REFERENCES `Niche`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey ContentTemplate → PackageCategory
ALTER TABLE `ContentTemplate` ADD CONSTRAINT `ContentTemplate_packageCategoryId_fkey`
    FOREIGN KEY (`packageCategoryId`) REFERENCES `PackageCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey ContentTemplate → Media
ALTER TABLE `ContentTemplate` ADD CONSTRAINT `ContentTemplate_mediaId_fkey`
    FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey ContentTemplatePlatform → ContentTemplate
ALTER TABLE `ContentTemplatePlatform` ADD CONSTRAINT `ContentTemplatePlatform_templateId_fkey`
    FOREIGN KEY (`templateId`) REFERENCES `ContentTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ContentTemplatePlatform → Platform
ALTER TABLE `ContentTemplatePlatform` ADD CONSTRAINT `ContentTemplatePlatform_platformId_fkey`
    FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MonthlyBatch → Client
ALTER TABLE `MonthlyBatch` ADD CONSTRAINT `MonthlyBatch_clientId_fkey`
    FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MonthlyContentItem → MonthlyBatch
ALTER TABLE `MonthlyContentItem` ADD CONSTRAINT `MonthlyContentItem_batchId_fkey`
    FOREIGN KEY (`batchId`) REFERENCES `MonthlyBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MonthlyContentItem → ContentTemplate
ALTER TABLE `MonthlyContentItem` ADD CONSTRAINT `MonthlyContentItem_templateId_fkey`
    FOREIGN KEY (`templateId`) REFERENCES `ContentTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey MonthlyContentPlatform → MonthlyContentItem
ALTER TABLE `MonthlyContentPlatform` ADD CONSTRAINT `MonthlyContentPlatform_contentItemId_fkey`
    FOREIGN KEY (`contentItemId`) REFERENCES `MonthlyContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MonthlyContentPlatform → Platform
ALTER TABLE `MonthlyContentPlatform` ADD CONSTRAINT `MonthlyContentPlatform_platformId_fkey`
    FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ContentPlatformCaption → MonthlyContentItem
ALTER TABLE `ContentPlatformCaption` ADD CONSTRAINT `ContentPlatformCaption_contentItemId_fkey`
    FOREIGN KEY (`contentItemId`) REFERENCES `MonthlyContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ContentPlatformCaption → Platform
ALTER TABLE `ContentPlatformCaption` ADD CONSTRAINT `ContentPlatformCaption_platformId_fkey`
    FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Approval → MonthlyContentItem
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_contentItemId_fkey`
    FOREIGN KEY (`contentItemId`) REFERENCES `MonthlyContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey DesignRequest → Client
ALTER TABLE `DesignRequest` ADD CONSTRAINT `DesignRequest_clientId_fkey`
    FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey DesignRequest → MonthlyContentItem
ALTER TABLE `DesignRequest` ADD CONSTRAINT `DesignRequest_contentItemId_fkey`
    FOREIGN KEY (`contentItemId`) REFERENCES `MonthlyContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey DesignRequestAsset → DesignRequest
ALTER TABLE `DesignRequestAsset` ADD CONSTRAINT `DesignRequestAsset_designRequestId_fkey`
    FOREIGN KEY (`designRequestId`) REFERENCES `DesignRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey DesignRequestAsset → Media
ALTER TABLE `DesignRequestAsset` ADD CONSTRAINT `DesignRequestAsset_mediaId_fkey`
    FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey TextEditHistory → MonthlyContentItem
ALTER TABLE `TextEditHistory` ADD CONSTRAINT `TextEditHistory_contentItemId_fkey`
    FOREIGN KEY (`contentItemId`) REFERENCES `MonthlyContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Feedback → Client
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_clientId_fkey`
    FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Notification → User
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AuditLog → User
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
