-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 10.123.0.33:3306
-- Generation Time: Feb 03, 2026 at 02:57 AM
-- Server version: 8.4.7
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ejaguiar1_favcreators`
--
CREATE DATABASE IF NOT EXISTS `ejaguiar1_favcreators` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `ejaguiar1_favcreators`;

-- --------------------------------------------------------

--
-- Table structure for table `creators`
--

CREATE TABLE `creators` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `bio` text,
  `avatar_url` varchar(1024) DEFAULT '',
  `category` varchar(128) DEFAULT '',
  `reason` varchar(255) DEFAULT '',
  `tags` text,
  `accounts` text,
  `is_favorite` tinyint(1) DEFAULT '0',
  `is_pinned` tinyint(1) DEFAULT '0',
  `in_guest_list` tinyint(1) DEFAULT '0',
  `guest_sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `creators`
--

INSERT INTO `creators` (`id`, `name`, `bio`, `avatar_url`, `category`, `reason`, `tags`, `accounts`, `is_favorite`, `is_pinned`, `in_guest_list`, `guest_sort_order`, `created_at`, `updated_at`) VALUES
('3', 'Adin Ross', 'Kick\'s No. 1 Creator | Live every day.', 'https://files.kick.com/images/user/904404/profile_image/conversion/e344be03-aff2-4791-ae5a-22a9ac4cf89a-fullsize.webp', 'Favorites', '', '[]', '[{\"id\":\"3a\",\"platform\":\"kick\",\"username\":\"adinross\",\"url\":\"https:\\/\\/kick.com\\/adinross\",\"followers\":\"1.9M\",\"isLive\":false,\"lastChecked\":1770062499210},{\"id\":\"3b\",\"platform\":\"youtube\",\"username\":\"adinross\",\"url\":\"https:\\/\\/youtube.com\\/@adinross\",\"followers\":\"4.6M\",\"lastChecked\":1770062499210}]', 1, 1, 1, 6, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('39c7c909-42fc-464f-b3db-1e1646ccc3d0', 'Tony Robbins', 'Auto-found social accounts for tony robbins', 'https://static-cdn.jtvnw.net/jtv_user_pictures/b9e1375c-f428-4a04-82f9-2f9bdd8724e9-profile_image-300x300.png', 'Other', '', '[\"LOVE THEIR CONTENT\"]', '[{\"id\":\"f381268c-35be-4b6e-a284-a5f0a877149a\",\"platform\":\"kick\",\"username\":\"tonyrobbins\",\"followers\":\"2.9M\",\"lastChecked\":1770071100017,\"url\":\"https:\\/\\/kick.com\\/tonyrobbins\"},{\"id\":\"8a596364-c359-4f13-b374-fced85c3aaa2\",\"platform\":\"twitch\",\"username\":\"tonyrobbins\",\"followers\":\"4.9M\",\"lastChecked\":1770071100017,\"url\":\"https:\\/\\/twitch.tv\\/tonyrobbins\"},{\"id\":\"db7058a3-b2e3-4b5b-84c7-2d332bef6bf7\",\"platform\":\"youtube\",\"username\":\"tonyrobbins\",\"followers\":\"3.6M\",\"lastChecked\":1770071100017,\"url\":\"https:\\/\\/youtube.com\\/@tonyrobbins\"},{\"id\":\"dd426e14-0307-4fb8-92f7-d244c8f93bd2\",\"platform\":\"tiktok\",\"username\":\"tonyrobbins\",\"followers\":\"5.4M\",\"lastChecked\":1770071100017,\"url\":\"https:\\/\\/tiktok.com\\/@tonyrobbins\"},{\"id\":\"c3091c26-21c7-4422-bcd8-2aadd0aca53b\",\"platform\":\"instagram\",\"username\":\"tonyrobbins\",\"followers\":\"1.3M\",\"lastChecked\":1770071100017,\"url\":\"https:\\/\\/instagram.com\\/tonyrobbins\"}]', 0, 0, 1, 0, '2026-02-02 22:25:12', '2026-02-02 22:25:12'),
('5445de3a-6411-4d12-a4ea-c5609eecf643', 'Tony Robbins', 'Auto-found social accounts for tony robbins', 'https://static-cdn.jtvnw.net/jtv_user_pictures/b9e1375c-f428-4a04-82f9-2f9bdd8724e9-profile_image-300x300.png', 'Other', '', '[\"LOVE THEIR CONTENT\"]', '[{\"id\":\"3b1b77bf-c839-42aa-a605-6071db7140c0\",\"platform\":\"kick\",\"username\":\"tonyrobbins\",\"followers\":\"4.2M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/kick.com\\/tonyrobbins\"},{\"id\":\"bbf0ed98-b23e-4326-ad95-d2a9156e6042\",\"platform\":\"twitch\",\"username\":\"tonyrobbins\",\"followers\":\"4.4M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/twitch.tv\\/tonyrobbins\"},{\"id\":\"bf1a170c-b84a-42f2-a011-d26fd4f22a29\",\"platform\":\"youtube\",\"username\":\"tonyrobbins\",\"followers\":\"4.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/youtube.com\\/@tonyrobbins\"},{\"id\":\"2a6ac4b0-1456-44fc-91ab-76e6db6c145f\",\"platform\":\"tiktok\",\"username\":\"tonyrobbins\",\"followers\":\"4.0M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/tiktok.com\\/@tonyrobbins\"},{\"id\":\"8d776c57-da43-41d5-9c97-a4f3e2268fd0\",\"platform\":\"instagram\",\"username\":\"tonyrobbins\",\"followers\":\"3.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/instagram.com\\/tonyrobbins\"}]', 0, 0, 1, 0, '2026-02-02 22:25:12', '2026-02-02 22:25:12'),
('6', 'Starfireara', 'Content creator and visionary.', '/fc/avatars/starfireara.jpg', 'Favorites', 'Motivational speaker', '[]', '[{\"id\":\"6b\",\"platform\":\"tiktok\",\"username\":\"starfireara\",\"url\":\"https:\\/\\/www.tiktok.com\\/@starfireara\",\"followers\":\"247.3K\",\"isLive\":false,\"lastChecked\":1770062515968},{\"id\":\"starfireara-linktree\",\"platform\":\"other\",\"username\":\"linktr.ee\\/starfiire\",\"url\":\"https:\\/\\/linktr.ee\\/starfiire\",\"lastChecked\":1770062515968}]', 1, 1, 1, 7, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('brooke-and-jeffrey-1', 'Brooke & Jeffrey', 'Phone Tap archives and prank call segments.', 'https://unavatar.io/https%3A%2F%2Fwww.brookeandjeffrey.com%2Ffeatured%2Fphone-tap-bjitm%2F', 'Other Content', '', '[\"PRANK CALLS\",\"RADIO\"]', '[{\"id\":\"brooke-and-jeffrey-phone-tap\",\"platform\":\"other\",\"username\":\"brookeandjeffrey.com\",\"url\":\"https:\\/\\/www.brookeandjeffrey.com\\/featured\\/phone-tap-bjitm\\/\",\"lastChecked\":1770062517599}]', 0, 0, 1, 10, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('chantellfloress-tiktok', 'Chantellfloress', 'Added from tiktok link', 'https://p19-common-sign.tiktokcdn-us.com/tos-useast8-avt-0068-tx2/5e72fb55d0558190a8ba818256d34b69~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=9640&refresh_token=69a852b0&x-expires=1770228000&x-signature=f%2Bmq%2FIp7Ml2qjbiFgtYGVnKbZ64%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=useast8', 'Other', '', '[\"LOVE THEIR CONTENT\"]', '[{\"id\":\"2dad4a63-69ba-4207-97ba-3eb44092f047\",\"platform\":\"tiktok\",\"username\":\"chantellfloress\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chantellfloress\",\"lastChecked\":1770062496951,\"isLive\":false}]', 0, 0, 1, 1, '2026-02-02 18:46:57', '2026-02-02 22:25:12'),
('chavcriss-1', 'Chavcriss', 'Fitness and comedy influencer.', 'https://unavatar.io/youtube/chavcriss', 'Fitness', 'Fitness & comedy inspiration.', '[\"FITNESS\",\"COMEDY\"]', '[{\"id\":\"chavcriss-tiktok\",\"platform\":\"tiktok\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chavcriss\",\"isLive\":false,\"lastChecked\":1770062516527},{\"id\":\"chavcriss-youtube\",\"platform\":\"youtube\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.youtube.com\\/@chavcriss\",\"lastChecked\":1770062516527}]', 1, 0, 1, 8, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('clavicular-1', 'Clavicular', 'Talented streamer and creator.', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Clavicular', 'Other', '', '[]', '[{\"id\":\"clavicular-kick\",\"platform\":\"kick\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/kick.com\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494},{\"id\":\"clavicular-twitch\",\"platform\":\"twitch\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/www.twitch.tv\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494}]', 0, 0, 1, 3, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('clip2prankmain-1', 'Clip2prankmain', 'TikTok creator.', 'https://unavatar.io/tiktok/clip2prankmain', 'Entertainment', '', '[\"LOVE THEIR CONTENT\"]', '[{\"id\":\"clip2prankmain-tiktok\",\"platform\":\"tiktok\",\"username\":\"clip2prankmain\",\"url\":\"https:\\/\\/www.tiktok.com\\/@clip2prankmain\",\"isLive\":false,\"lastChecked\":1770062518102}]', 0, 0, 1, 11, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('jubalfresh-1', 'Jubal Fresh', 'Prank phone calls and radio bits.', 'https://unavatar.io/youtube/jubalfresh', 'Prank Phone Calls', '', '[\"PRANK CALLS\",\"COMEDY\"]', '[{\"id\":\"jubalfresh-youtube\",\"platform\":\"youtube\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.youtube.com\\/@jubalfresh\",\"lastChecked\":1770062517068},{\"id\":\"jubalfresh-tiktok\",\"platform\":\"tiktok\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.tiktok.com\\/@jubalfresh\",\"isLive\":false,\"lastChecked\":1770062517068}]', 0, 0, 1, 9, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('thebenjishow-1', 'The Benji Show', 'Hilarious skits and comedy bits.', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=The%20Benji%20Show', 'Hilarious Skits', '', '[\"COMEDY\",\"SKITS\"]', '[{\"id\":\"thebenjishow-tiktok\",\"platform\":\"tiktok\",\"username\":\"thebenjishow\",\"url\":\"https:\\/\\/www.tiktok.com\\/@thebenjishow\",\"isLive\":false,\"lastChecked\":1770062498125}]', 0, 0, 1, 4, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('wtfpreston-1', 'WTFPreston', 'Comedy musician and streamer.', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=WTFPreston', 'Other', 'He makes funny songs.', '[\"COMEDY\",\"MUSIC\"]', '[{\"id\":\"wtfpreston-tiktok\",\"platform\":\"tiktok\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.tiktok.com\\/@wtfprestonlive\",\"followers\":\"330K\",\"isLive\":false,\"lastChecked\":1770062496982},{\"id\":\"wtfpreston-youtube\",\"platform\":\"youtube\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.youtube.com\\/@wtfprestonlive\",\"lastChecked\":1770062496982}]', 0, 0, 1, 2, '2026-02-02 18:44:24', '2026-02-02 22:25:12'),
('zarthestar-1', 'Zarthestar', 'Cosmic content creator. TikTok comedy & lifestyle.', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Zarthestar', 'Other', '', '[]', '[{\"id\":\"zarthestar-tiktok\",\"platform\":\"tiktok\",\"username\":\"zarthestarcomedy\",\"url\":\"https:\\/\\/www.tiktok.com\\/@zarthestarcomedy\",\"followers\":\"125K\",\"isLive\":false,\"lastChecked\":1770062498666}]', 0, 0, 1, 5, '2026-02-02 18:44:24', '2026-02-02 22:25:12');

-- --------------------------------------------------------

--
-- Table structure for table `creator_defaults`
--

CREATE TABLE `creator_defaults` (
  `id` int NOT NULL,
  `creator_id` varchar(100) NOT NULL,
  `note` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `creator_defaults`
--

INSERT INTO `creator_defaults` (`id`, `creator_id`, `note`, `updated_at`) VALUES
(1, '6', 'test eltons testing on february 2 2026 XYZ DRAGON!', '2026-02-02 17:44:59'),
(2, '37301b22-fa6f-4218-a3dc-1d2dd3a4a6d0', 'test', '2026-02-02 18:24:15'),
(3, 'chantellfloress-tiktok', 'test', '2026-02-02 18:47:01');

-- --------------------------------------------------------

--
-- Table structure for table `favcreatorslogs`
--

CREATE TABLE `favcreatorslogs` (
  `id` int NOT NULL,
  `action` varchar(64) NOT NULL,
  `endpoint` varchar(128) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_ip` varchar(45) DEFAULT NULL,
  `status` varchar(16) NOT NULL,
  `message` text,
  `payload_summary` text,
  `error_details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `display_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `display_name`, `created_at`) VALUES
(1, 'elton', 'elton', 'user', 'Elton', '2026-02-01 02:37:33'),
(2, 'zerounderscore@gmail.com', '9dc16db999afd5a8', 'user', 'E A', '2026-02-01 03:03:45'),
(3, 'bob', 'bob', 'user', 'Bob', '2026-02-02 22:28:19'),
(4, 'bob1', 'efc1a6c51e2e2ec8e6bf592cf142d313', 'user', 'Bob Test User', '2026-02-03 02:11:15');

-- --------------------------------------------------------

--
-- Table structure for table `user_link_lists`
--

CREATE TABLE `user_link_lists` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `list_name` varchar(255) NOT NULL,
  `links` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_lists`
--

CREATE TABLE `user_lists` (
  `user_id` int NOT NULL,
  `creators` longtext,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_lists`
--

INSERT INTO `user_lists` (`user_id`, `creators`, `updated_at`) VALUES
(0, '[{\"id\":\"5445de3a-6411-4d12-a4ea-c5609eecf643\",\"name\":\"Tony Robbins\",\"bio\":\"Auto-found social accounts for tony robbins\",\"avatarUrl\":\"https:\\/\\/static-cdn.jtvnw.net\\/jtv_user_pictures\\/b9e1375c-f428-4a04-82f9-2f9bdd8724e9-profile_image-300x300.png\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"3b1b77bf-c839-42aa-a605-6071db7140c0\",\"platform\":\"kick\",\"username\":\"tonyrobbins\",\"followers\":\"4.2M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/kick.com\\/tonyrobbins\"},{\"id\":\"bbf0ed98-b23e-4326-ad95-d2a9156e6042\",\"platform\":\"twitch\",\"username\":\"tonyrobbins\",\"followers\":\"4.4M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/twitch.tv\\/tonyrobbins\"},{\"id\":\"bf1a170c-b84a-42f2-a011-d26fd4f22a29\",\"platform\":\"youtube\",\"username\":\"tonyrobbins\",\"followers\":\"4.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/youtube.com\\/@tonyrobbins\"},{\"id\":\"2a6ac4b0-1456-44fc-91ab-76e6db6c145f\",\"platform\":\"tiktok\",\"username\":\"tonyrobbins\",\"followers\":\"4.0M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/tiktok.com\\/@tonyrobbins\"},{\"id\":\"8d776c57-da43-41d5-9c97-a4f3e2268fd0\",\"platform\":\"instagram\",\"username\":\"tonyrobbins\",\"followers\":\"3.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/instagram.com\\/tonyrobbins\"}],\"addedAt\":1770071101691,\"lastChecked\":1770071101691},{\"id\":\"chantellfloress-tiktok\",\"name\":\"Chantellfloress\",\"bio\":\"Added from tiktok link\",\"avatarUrl\":\"https:\\/\\/p19-common-sign.tiktokcdn-us.com\\/tos-useast8-avt-0068-tx2\\/5e72fb55d0558190a8ba818256d34b69~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=9640&refresh_token=69a852b0&x-expires=1770228000&x-signature=f%2Bmq%2FIp7Ml2qjbiFgtYGVnKbZ64%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=useast8\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"test\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"2dad4a63-69ba-4207-97ba-3eb44092f047\",\"platform\":\"tiktok\",\"username\":\"chantellfloress\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chantellfloress\",\"lastChecked\":1770062496951,\"isLive\":false}],\"addedAt\":1770058016891,\"lastChecked\":1770062496951},{\"id\":\"wtfpreston-1\",\"name\":\"WTFPreston\",\"bio\":\"Comedy musician and streamer.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=WTFPreston\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"He makes funny songs.\",\"note\":\"\",\"tags\":[\"COMEDY\",\"MUSIC\"],\"accounts\":[{\"id\":\"wtfpreston-tiktok\",\"platform\":\"tiktok\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.tiktok.com\\/@wtfprestonlive\",\"followers\":\"330K\",\"isLive\":false,\"lastChecked\":1770062496982},{\"id\":\"wtfpreston-youtube\",\"platform\":\"youtube\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.youtube.com\\/@wtfprestonlive\",\"lastChecked\":1770062496982}],\"addedAt\":0,\"lastChecked\":1770062496982},{\"id\":\"clavicular-1\",\"name\":\"Clavicular\",\"bio\":\"Talented streamer and creator.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Clavicular\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"clavicular-kick\",\"platform\":\"kick\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/kick.com\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494},{\"id\":\"clavicular-twitch\",\"platform\":\"twitch\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/www.twitch.tv\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494}],\"addedAt\":0,\"lastChecked\":1770062497494},{\"id\":\"thebenjishow-1\",\"name\":\"The Benji Show\",\"bio\":\"Hilarious skits and comedy bits.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=The%20Benji%20Show\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Hilarious Skits\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"COMEDY\",\"SKITS\"],\"accounts\":[{\"id\":\"thebenjishow-tiktok\",\"platform\":\"tiktok\",\"username\":\"thebenjishow\",\"url\":\"https:\\/\\/www.tiktok.com\\/@thebenjishow\",\"isLive\":false,\"lastChecked\":1770062498125}],\"addedAt\":0,\"lastChecked\":1770062498125},{\"id\":\"zarthestar-1\",\"name\":\"Zarthestar\",\"bio\":\"Cosmic content creator. TikTok comedy & lifestyle.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Zarthestar\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"zarthestar-tiktok\",\"platform\":\"tiktok\",\"username\":\"zarthestarcomedy\",\"url\":\"https:\\/\\/www.tiktok.com\\/@zarthestarcomedy\",\"followers\":\"125K\",\"isLive\":false,\"lastChecked\":1770062498666}],\"addedAt\":0,\"lastChecked\":1770062498666},{\"id\":\"3\",\"name\":\"Adin Ross\",\"bio\":\"Kick\'s No. 1 Creator | Live every day.\",\"avatarUrl\":\"https:\\/\\/files.kick.com\\/images\\/user\\/904404\\/profile_image\\/conversion\\/e344be03-aff2-4791-ae5a-22a9ac4cf89a-fullsize.webp\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"3a\",\"platform\":\"kick\",\"username\":\"adinross\",\"url\":\"https:\\/\\/kick.com\\/adinross\",\"followers\":\"1.9M\",\"isLive\":false,\"lastChecked\":1770062499210},{\"id\":\"3b\",\"platform\":\"youtube\",\"username\":\"adinross\",\"url\":\"https:\\/\\/youtube.com\\/@adinross\",\"followers\":\"4.6M\",\"lastChecked\":1770062499210}],\"addedAt\":0,\"lastChecked\":1770062499210},{\"id\":\"6\",\"name\":\"Starfireara\",\"bio\":\"Content creator and visionary.\",\"avatarUrl\":\"\\/fc\\/avatars\\/starfireara.jpg\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"Motivational speaker\",\"note\":\"test eltons testing on february 2 2026 XYZ DRAGON!\",\"tags\":[],\"accounts\":[{\"id\":\"6b\",\"platform\":\"tiktok\",\"username\":\"starfireara\",\"url\":\"https:\\/\\/www.tiktok.com\\/@starfireara\",\"followers\":\"247.3K\",\"isLive\":false,\"lastChecked\":1770062515968},{\"id\":\"starfireara-linktree\",\"platform\":\"other\",\"username\":\"linktr.ee\\/starfiire\",\"url\":\"https:\\/\\/linktr.ee\\/starfiire\",\"lastChecked\":1770062515968}],\"addedAt\":0,\"lastChecked\":1770062515968,\"secondaryNote\":\"testing 123\\nwww.google.com\"},{\"id\":\"chavcriss-1\",\"name\":\"Chavcriss\",\"bio\":\"Fitness and comedy influencer.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/chavcriss\",\"isFavorite\":true,\"isPinned\":false,\"category\":\"Fitness\",\"reason\":\"Fitness & comedy inspiration.\",\"note\":\"\",\"tags\":[\"FITNESS\",\"COMEDY\"],\"accounts\":[{\"id\":\"chavcriss-tiktok\",\"platform\":\"tiktok\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chavcriss\",\"isLive\":false,\"lastChecked\":1770062516527},{\"id\":\"chavcriss-youtube\",\"platform\":\"youtube\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.youtube.com\\/@chavcriss\",\"lastChecked\":1770062516527}],\"addedAt\":0,\"lastChecked\":1770062516527},{\"id\":\"jubalfresh-1\",\"name\":\"Jubal Fresh\",\"bio\":\"Prank phone calls and radio bits.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/jubalfresh\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Prank Phone Calls\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"COMEDY\"],\"accounts\":[{\"id\":\"jubalfresh-youtube\",\"platform\":\"youtube\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.youtube.com\\/@jubalfresh\",\"lastChecked\":1770062517068},{\"id\":\"jubalfresh-tiktok\",\"platform\":\"tiktok\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.tiktok.com\\/@jubalfresh\",\"isLive\":false,\"lastChecked\":1770062517068}],\"addedAt\":0,\"lastChecked\":1770062517068},{\"id\":\"brooke-and-jeffrey-1\",\"name\":\"Brooke & Jeffrey\",\"bio\":\"Phone Tap archives and prank call segments.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/https%3A%2F%2Fwww.brookeandjeffrey.com%2Ffeatured%2Fphone-tap-bjitm%2F\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other Content\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"RADIO\"],\"accounts\":[{\"id\":\"brooke-and-jeffrey-phone-tap\",\"platform\":\"other\",\"username\":\"brookeandjeffrey.com\",\"url\":\"https:\\/\\/www.brookeandjeffrey.com\\/featured\\/phone-tap-bjitm\\/\",\"lastChecked\":1770062517599}],\"addedAt\":0,\"lastChecked\":1770062517599},{\"id\":\"clip2prankmain-1\",\"name\":\"Clip2prankmain\",\"bio\":\"TikTok creator.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/tiktok\\/clip2prankmain\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Entertainment\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"clip2prankmain-tiktok\",\"platform\":\"tiktok\",\"username\":\"clip2prankmain\",\"url\":\"https:\\/\\/www.tiktok.com\\/@clip2prankmain\",\"isLive\":false,\"lastChecked\":1770062518102}],\"addedAt\":0,\"lastChecked\":1770062518102}]', '2026-02-02 22:25:25'),
(2, '[{\"id\":\"5445de3a-6411-4d12-a4ea-c5609eecf643\",\"name\":\"Tony Robbins\",\"bio\":\"Auto-found social accounts for tony robbins\",\"avatarUrl\":\"https:\\/\\/static-cdn.jtvnw.net\\/jtv_user_pictures\\/b9e1375c-f428-4a04-82f9-2f9bdd8724e9-profile_image-300x300.png\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"3b1b77bf-c839-42aa-a605-6071db7140c0\",\"platform\":\"kick\",\"username\":\"tonyrobbins\",\"followers\":\"4.2M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/kick.com\\/tonyrobbins\"},{\"id\":\"bbf0ed98-b23e-4326-ad95-d2a9156e6042\",\"platform\":\"twitch\",\"username\":\"tonyrobbins\",\"followers\":\"4.4M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/twitch.tv\\/tonyrobbins\"},{\"id\":\"bf1a170c-b84a-42f2-a011-d26fd4f22a29\",\"platform\":\"youtube\",\"username\":\"tonyrobbins\",\"followers\":\"4.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/youtube.com\\/@tonyrobbins\"},{\"id\":\"2a6ac4b0-1456-44fc-91ab-76e6db6c145f\",\"platform\":\"tiktok\",\"username\":\"tonyrobbins\",\"followers\":\"4.0M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/tiktok.com\\/@tonyrobbins\"},{\"id\":\"8d776c57-da43-41d5-9c97-a4f3e2268fd0\",\"platform\":\"instagram\",\"username\":\"tonyrobbins\",\"followers\":\"3.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/instagram.com\\/tonyrobbins\"}],\"addedAt\":1770071101691,\"lastChecked\":1770071101691},{\"id\":\"chantellfloress-tiktok\",\"name\":\"Chantellfloress\",\"bio\":\"Added from tiktok link\",\"avatarUrl\":\"https:\\/\\/p19-common-sign.tiktokcdn-us.com\\/tos-useast8-avt-0068-tx2\\/5e72fb55d0558190a8ba818256d34b69~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=9640&refresh_token=69a852b0&x-expires=1770228000&x-signature=f%2Bmq%2FIp7Ml2qjbiFgtYGVnKbZ64%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=useast8\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"test\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"2dad4a63-69ba-4207-97ba-3eb44092f047\",\"platform\":\"tiktok\",\"username\":\"chantellfloress\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chantellfloress\",\"lastChecked\":1770062496951,\"isLive\":false}],\"addedAt\":1770058016891,\"lastChecked\":1770062496951},{\"id\":\"wtfpreston-1\",\"name\":\"WTFPreston\",\"bio\":\"Comedy musician and streamer.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=WTFPreston\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"He makes funny songs.\",\"note\":\"\",\"tags\":[\"COMEDY\",\"MUSIC\"],\"accounts\":[{\"id\":\"wtfpreston-tiktok\",\"platform\":\"tiktok\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.tiktok.com\\/@wtfprestonlive\",\"followers\":\"330K\",\"isLive\":false,\"lastChecked\":1770062496982},{\"id\":\"wtfpreston-youtube\",\"platform\":\"youtube\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.youtube.com\\/@wtfprestonlive\",\"lastChecked\":1770062496982}],\"addedAt\":0,\"lastChecked\":1770062496982},{\"id\":\"clavicular-1\",\"name\":\"Clavicular\",\"bio\":\"Talented streamer and creator.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Clavicular\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"clavicular-kick\",\"platform\":\"kick\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/kick.com\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494},{\"id\":\"clavicular-twitch\",\"platform\":\"twitch\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/www.twitch.tv\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494}],\"addedAt\":0,\"lastChecked\":1770062497494},{\"id\":\"thebenjishow-1\",\"name\":\"The Benji Show\",\"bio\":\"Hilarious skits and comedy bits.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=The%20Benji%20Show\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Hilarious Skits\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"COMEDY\",\"SKITS\"],\"accounts\":[{\"id\":\"thebenjishow-tiktok\",\"platform\":\"tiktok\",\"username\":\"thebenjishow\",\"url\":\"https:\\/\\/www.tiktok.com\\/@thebenjishow\",\"isLive\":false,\"lastChecked\":1770062498125}],\"addedAt\":0,\"lastChecked\":1770062498125},{\"id\":\"zarthestar-1\",\"name\":\"Zarthestar\",\"bio\":\"Cosmic content creator. TikTok comedy & lifestyle.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Zarthestar\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"zarthestar-tiktok\",\"platform\":\"tiktok\",\"username\":\"zarthestarcomedy\",\"url\":\"https:\\/\\/www.tiktok.com\\/@zarthestarcomedy\",\"followers\":\"125K\",\"isLive\":false,\"lastChecked\":1770062498666}],\"addedAt\":0,\"lastChecked\":1770062498666},{\"id\":\"3\",\"name\":\"Adin Ross\",\"bio\":\"Kick\'s No. 1 Creator | Live every day.\",\"avatarUrl\":\"https:\\/\\/files.kick.com\\/images\\/user\\/904404\\/profile_image\\/conversion\\/e344be03-aff2-4791-ae5a-22a9ac4cf89a-fullsize.webp\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"3a\",\"platform\":\"kick\",\"username\":\"adinross\",\"url\":\"https:\\/\\/kick.com\\/adinross\",\"followers\":\"1.9M\",\"isLive\":false,\"lastChecked\":1770062499210},{\"id\":\"3b\",\"platform\":\"youtube\",\"username\":\"adinross\",\"url\":\"https:\\/\\/youtube.com\\/@adinross\",\"followers\":\"4.6M\",\"lastChecked\":1770062499210}],\"addedAt\":0,\"lastChecked\":1770062499210},{\"id\":\"6\",\"name\":\"Starfireara\",\"bio\":\"Content creator and visionary.\",\"avatarUrl\":\"\\/fc\\/avatars\\/starfireara.jpg\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"Motivational speaker\",\"note\":\"test eltons testing on february 2 2026 XYZ DRAGON!\",\"tags\":[],\"accounts\":[{\"id\":\"6b\",\"platform\":\"tiktok\",\"username\":\"starfireara\",\"url\":\"https:\\/\\/www.tiktok.com\\/@starfireara\",\"followers\":\"247.3K\",\"isLive\":false,\"lastChecked\":1770062515968},{\"id\":\"starfireara-linktree\",\"platform\":\"other\",\"username\":\"linktr.ee\\/starfiire\",\"url\":\"https:\\/\\/linktr.ee\\/starfiire\",\"lastChecked\":1770062515968}],\"addedAt\":0,\"lastChecked\":1770062515968,\"secondaryNote\":\"testing 123\\nwww.google.com\"},{\"id\":\"chavcriss-1\",\"name\":\"Chavcriss\",\"bio\":\"Fitness and comedy influencer.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/chavcriss\",\"isFavorite\":true,\"isPinned\":false,\"category\":\"Fitness\",\"reason\":\"Fitness & comedy inspiration.\",\"note\":\"\",\"tags\":[\"FITNESS\",\"COMEDY\"],\"accounts\":[{\"id\":\"chavcriss-tiktok\",\"platform\":\"tiktok\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chavcriss\",\"isLive\":false,\"lastChecked\":1770062516527},{\"id\":\"chavcriss-youtube\",\"platform\":\"youtube\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.youtube.com\\/@chavcriss\",\"lastChecked\":1770062516527}],\"addedAt\":0,\"lastChecked\":1770062516527},{\"id\":\"jubalfresh-1\",\"name\":\"Jubal Fresh\",\"bio\":\"Prank phone calls and radio bits.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/jubalfresh\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Prank Phone Calls\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"COMEDY\"],\"accounts\":[{\"id\":\"jubalfresh-youtube\",\"platform\":\"youtube\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.youtube.com\\/@jubalfresh\",\"lastChecked\":1770062517068},{\"id\":\"jubalfresh-tiktok\",\"platform\":\"tiktok\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.tiktok.com\\/@jubalfresh\",\"isLive\":false,\"lastChecked\":1770062517068}],\"addedAt\":0,\"lastChecked\":1770062517068},{\"id\":\"brooke-and-jeffrey-1\",\"name\":\"Brooke & Jeffrey\",\"bio\":\"Phone Tap archives and prank call segments.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/https%3A%2F%2Fwww.brookeandjeffrey.com%2Ffeatured%2Fphone-tap-bjitm%2F\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other Content\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"RADIO\"],\"accounts\":[{\"id\":\"brooke-and-jeffrey-phone-tap\",\"platform\":\"other\",\"username\":\"brookeandjeffrey.com\",\"url\":\"https:\\/\\/www.brookeandjeffrey.com\\/featured\\/phone-tap-bjitm\\/\",\"lastChecked\":1770062517599}],\"addedAt\":0,\"lastChecked\":1770062517599},{\"id\":\"clip2prankmain-1\",\"name\":\"Clip2prankmain\",\"bio\":\"TikTok creator.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/tiktok\\/clip2prankmain\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Entertainment\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"clip2prankmain-tiktok\",\"platform\":\"tiktok\",\"username\":\"clip2prankmain\",\"url\":\"https:\\/\\/www.tiktok.com\\/@clip2prankmain\",\"isLive\":false,\"lastChecked\":1770062518102}],\"addedAt\":0,\"lastChecked\":1770062518102},{\"id\":\"brunitarte-tiktok\",\"name\":\"Brunitarte\",\"bio\":\"\",\"avatarUrl\":\"\",\"category\":\"other\",\"reason\":\"\",\"tags\":[],\"accounts\":[{\"platform\":\"tiktok\",\"username\":\"brunitarte\",\"url\":\"https:\\/\\/www.tiktok.com\\/@brunitarte\"}],\"isFavorite\":false,\"isPinned\":false}]', '2026-02-03 02:02:03'),
(3, '[{\"id\":\"5445de3a-6411-4d12-a4ea-c5609eecf643\",\"name\":\"Tony Robbins\",\"bio\":\"Auto-found social accounts for tony robbins\",\"avatarUrl\":\"https:\\/\\/static-cdn.jtvnw.net\\/jtv_user_pictures\\/b9e1375c-f428-4a04-82f9-2f9bdd8724e9-profile_image-300x300.png\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"3b1b77bf-c839-42aa-a605-6071db7140c0\",\"platform\":\"kick\",\"username\":\"tonyrobbins\",\"followers\":\"4.2M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/kick.com\\/tonyrobbins\"},{\"id\":\"bbf0ed98-b23e-4326-ad95-d2a9156e6042\",\"platform\":\"twitch\",\"username\":\"tonyrobbins\",\"followers\":\"4.4M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/twitch.tv\\/tonyrobbins\"},{\"id\":\"bf1a170c-b84a-42f2-a011-d26fd4f22a29\",\"platform\":\"youtube\",\"username\":\"tonyrobbins\",\"followers\":\"4.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/youtube.com\\/@tonyrobbins\"},{\"id\":\"2a6ac4b0-1456-44fc-91ab-76e6db6c145f\",\"platform\":\"tiktok\",\"username\":\"tonyrobbins\",\"followers\":\"4.0M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/tiktok.com\\/@tonyrobbins\"},{\"id\":\"8d776c57-da43-41d5-9c97-a4f3e2268fd0\",\"platform\":\"instagram\",\"username\":\"tonyrobbins\",\"followers\":\"3.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/instagram.com\\/tonyrobbins\"}],\"addedAt\":1770071101691,\"lastChecked\":1770071101691},{\"id\":\"chantellfloress-tiktok\",\"name\":\"Chantellfloress\",\"bio\":\"Added from tiktok link\",\"avatarUrl\":\"https:\\/\\/p19-common-sign.tiktokcdn-us.com\\/tos-useast8-avt-0068-tx2\\/5e72fb55d0558190a8ba818256d34b69~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=9640&refresh_token=69a852b0&x-expires=1770228000&x-signature=f%2Bmq%2FIp7Ml2qjbiFgtYGVnKbZ64%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=useast8\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"test\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"2dad4a63-69ba-4207-97ba-3eb44092f047\",\"platform\":\"tiktok\",\"username\":\"chantellfloress\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chantellfloress\",\"lastChecked\":1770062496951,\"isLive\":false}],\"addedAt\":1770058016891,\"lastChecked\":1770062496951},{\"id\":\"wtfpreston-1\",\"name\":\"WTFPreston\",\"bio\":\"Comedy musician and streamer.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=WTFPreston\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"He makes funny songs.\",\"note\":\"\",\"tags\":[\"COMEDY\",\"MUSIC\"],\"accounts\":[{\"id\":\"wtfpreston-tiktok\",\"platform\":\"tiktok\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.tiktok.com\\/@wtfprestonlive\",\"followers\":\"330K\",\"isLive\":false,\"lastChecked\":1770062496982},{\"id\":\"wtfpreston-youtube\",\"platform\":\"youtube\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.youtube.com\\/@wtfprestonlive\",\"lastChecked\":1770062496982}],\"addedAt\":0,\"lastChecked\":1770062496982},{\"id\":\"clavicular-1\",\"name\":\"Clavicular\",\"bio\":\"Talented streamer and creator.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Clavicular\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"clavicular-kick\",\"platform\":\"kick\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/kick.com\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494},{\"id\":\"clavicular-twitch\",\"platform\":\"twitch\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/www.twitch.tv\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494}],\"addedAt\":0,\"lastChecked\":1770062497494},{\"id\":\"thebenjishow-1\",\"name\":\"The Benji Show\",\"bio\":\"Hilarious skits and comedy bits.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=The%20Benji%20Show\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Hilarious Skits\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"COMEDY\",\"SKITS\"],\"accounts\":[{\"id\":\"thebenjishow-tiktok\",\"platform\":\"tiktok\",\"username\":\"thebenjishow\",\"url\":\"https:\\/\\/www.tiktok.com\\/@thebenjishow\",\"isLive\":false,\"lastChecked\":1770062498125}],\"addedAt\":0,\"lastChecked\":1770062498125},{\"id\":\"zarthestar-1\",\"name\":\"Zarthestar\",\"bio\":\"Cosmic content creator. TikTok comedy & lifestyle.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Zarthestar\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"zarthestar-tiktok\",\"platform\":\"tiktok\",\"username\":\"zarthestarcomedy\",\"url\":\"https:\\/\\/www.tiktok.com\\/@zarthestarcomedy\",\"followers\":\"125K\",\"isLive\":false,\"lastChecked\":1770062498666}],\"addedAt\":0,\"lastChecked\":1770062498666},{\"id\":\"3\",\"name\":\"Adin Ross\",\"bio\":\"Kick\'s No. 1 Creator | Live every day.\",\"avatarUrl\":\"https:\\/\\/files.kick.com\\/images\\/user\\/904404\\/profile_image\\/conversion\\/e344be03-aff2-4791-ae5a-22a9ac4cf89a-fullsize.webp\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"3a\",\"platform\":\"kick\",\"username\":\"adinross\",\"url\":\"https:\\/\\/kick.com\\/adinross\",\"followers\":\"1.9M\",\"isLive\":false,\"lastChecked\":1770062499210},{\"id\":\"3b\",\"platform\":\"youtube\",\"username\":\"adinross\",\"url\":\"https:\\/\\/youtube.com\\/@adinross\",\"followers\":\"4.6M\",\"lastChecked\":1770062499210}],\"addedAt\":0,\"lastChecked\":1770062499210},{\"id\":\"6\",\"name\":\"Starfireara\",\"bio\":\"Content creator and visionary.\",\"avatarUrl\":\"\\/fc\\/avatars\\/starfireara.jpg\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"Motivational speaker\",\"note\":\"test eltons testing on february 2 2026 XYZ DRAGON!\",\"tags\":[],\"accounts\":[{\"id\":\"6b\",\"platform\":\"tiktok\",\"username\":\"starfireara\",\"url\":\"https:\\/\\/www.tiktok.com\\/@starfireara\",\"followers\":\"247.3K\",\"isLive\":false,\"lastChecked\":1770062515968},{\"id\":\"starfireara-linktree\",\"platform\":\"other\",\"username\":\"linktr.ee\\/starfiire\",\"url\":\"https:\\/\\/linktr.ee\\/starfiire\",\"lastChecked\":1770062515968}],\"addedAt\":0,\"lastChecked\":1770062515968,\"secondaryNote\":\"testing 123\\nwww.google.com\"},{\"id\":\"chavcriss-1\",\"name\":\"Chavcriss\",\"bio\":\"Fitness and comedy influencer.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/chavcriss\",\"isFavorite\":true,\"isPinned\":false,\"category\":\"Fitness\",\"reason\":\"Fitness & comedy inspiration.\",\"note\":\"\",\"tags\":[\"FITNESS\",\"COMEDY\"],\"accounts\":[{\"id\":\"chavcriss-tiktok\",\"platform\":\"tiktok\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chavcriss\",\"isLive\":false,\"lastChecked\":1770062516527},{\"id\":\"chavcriss-youtube\",\"platform\":\"youtube\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.youtube.com\\/@chavcriss\",\"lastChecked\":1770062516527}],\"addedAt\":0,\"lastChecked\":1770062516527},{\"id\":\"jubalfresh-1\",\"name\":\"Jubal Fresh\",\"bio\":\"Prank phone calls and radio bits.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/jubalfresh\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Prank Phone Calls\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"COMEDY\"],\"accounts\":[{\"id\":\"jubalfresh-youtube\",\"platform\":\"youtube\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.youtube.com\\/@jubalfresh\",\"lastChecked\":1770062517068},{\"id\":\"jubalfresh-tiktok\",\"platform\":\"tiktok\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.tiktok.com\\/@jubalfresh\",\"isLive\":false,\"lastChecked\":1770062517068}],\"addedAt\":0,\"lastChecked\":1770062517068},{\"id\":\"brooke-and-jeffrey-1\",\"name\":\"Brooke & Jeffrey\",\"bio\":\"Phone Tap archives and prank call segments.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/https%3A%2F%2Fwww.brookeandjeffrey.com%2Ffeatured%2Fphone-tap-bjitm%2F\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other Content\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"RADIO\"],\"accounts\":[{\"id\":\"brooke-and-jeffrey-phone-tap\",\"platform\":\"other\",\"username\":\"brookeandjeffrey.com\",\"url\":\"https:\\/\\/www.brookeandjeffrey.com\\/featured\\/phone-tap-bjitm\\/\",\"lastChecked\":1770062517599}],\"addedAt\":0,\"lastChecked\":1770062517599},{\"id\":\"clip2prankmain-1\",\"name\":\"Clip2prankmain\",\"bio\":\"TikTok creator.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/tiktok\\/clip2prankmain\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Entertainment\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"clip2prankmain-tiktok\",\"platform\":\"tiktok\",\"username\":\"clip2prankmain\",\"url\":\"https:\\/\\/www.tiktok.com\\/@clip2prankmain\",\"isLive\":false,\"lastChecked\":1770062518102}],\"addedAt\":0,\"lastChecked\":1770062518102},{\"id\":\"brunitarte-tiktok\",\"name\":\"Brunitarte\",\"bio\":\"\",\"avatarUrl\":\"\",\"category\":\"other\",\"reason\":\"\",\"tags\":[],\"accounts\":[{\"platform\":\"tiktok\",\"username\":\"brunitarte\",\"url\":\"https:\\/\\/www.tiktok.com\\/@brunitarte\"}],\"isFavorite\":false,\"isPinned\":false}]', '2026-02-03 00:57:13'),
(4, '[{\"id\":\"5445de3a-6411-4d12-a4ea-c5609eecf643\",\"name\":\"Tony Robbins\",\"bio\":\"Auto-found social accounts for tony robbins\",\"avatarUrl\":\"https:\\/\\/static-cdn.jtvnw.net\\/jtv_user_pictures\\/b9e1375c-f428-4a04-82f9-2f9bdd8724e9-profile_image-300x300.png\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"3b1b77bf-c839-42aa-a605-6071db7140c0\",\"platform\":\"kick\",\"username\":\"tonyrobbins\",\"followers\":\"4.2M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/kick.com\\/tonyrobbins\"},{\"id\":\"bbf0ed98-b23e-4326-ad95-d2a9156e6042\",\"platform\":\"twitch\",\"username\":\"tonyrobbins\",\"followers\":\"4.4M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/twitch.tv\\/tonyrobbins\"},{\"id\":\"bf1a170c-b84a-42f2-a011-d26fd4f22a29\",\"platform\":\"youtube\",\"username\":\"tonyrobbins\",\"followers\":\"4.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/youtube.com\\/@tonyrobbins\"},{\"id\":\"2a6ac4b0-1456-44fc-91ab-76e6db6c145f\",\"platform\":\"tiktok\",\"username\":\"tonyrobbins\",\"followers\":\"4.0M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/tiktok.com\\/@tonyrobbins\"},{\"id\":\"8d776c57-da43-41d5-9c97-a4f3e2268fd0\",\"platform\":\"instagram\",\"username\":\"tonyrobbins\",\"followers\":\"3.7M\",\"lastChecked\":1770071101691,\"url\":\"https:\\/\\/instagram.com\\/tonyrobbins\"}],\"addedAt\":1770071101691,\"lastChecked\":1770071101691},{\"id\":\"chantellfloress-tiktok\",\"name\":\"Chantellfloress\",\"bio\":\"Added from tiktok link\",\"avatarUrl\":\"https:\\/\\/p19-common-sign.tiktokcdn-us.com\\/tos-useast8-avt-0068-tx2\\/5e72fb55d0558190a8ba818256d34b69~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=9640&refresh_token=69a852b0&x-expires=1770228000&x-signature=f%2Bmq%2FIp7Ml2qjbiFgtYGVnKbZ64%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=useast8\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"test\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"2dad4a63-69ba-4207-97ba-3eb44092f047\",\"platform\":\"tiktok\",\"username\":\"chantellfloress\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chantellfloress\",\"lastChecked\":1770062496951,\"isLive\":false}],\"addedAt\":1770058016891,\"lastChecked\":1770062496951},{\"id\":\"wtfpreston-1\",\"name\":\"WTFPreston\",\"bio\":\"Comedy musician and streamer.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=WTFPreston\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"He makes funny songs.\",\"note\":\"\",\"tags\":[\"COMEDY\",\"MUSIC\"],\"accounts\":[{\"id\":\"wtfpreston-tiktok\",\"platform\":\"tiktok\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.tiktok.com\\/@wtfprestonlive\",\"followers\":\"330K\",\"isLive\":false,\"lastChecked\":1770062496982},{\"id\":\"wtfpreston-youtube\",\"platform\":\"youtube\",\"username\":\"wtfprestonlive\",\"url\":\"https:\\/\\/www.youtube.com\\/@wtfprestonlive\",\"lastChecked\":1770062496982}],\"addedAt\":0,\"lastChecked\":1770062496982},{\"id\":\"clavicular-1\",\"name\":\"Clavicular\",\"bio\":\"Talented streamer and creator.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Clavicular\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"clavicular-kick\",\"platform\":\"kick\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/kick.com\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494},{\"id\":\"clavicular-twitch\",\"platform\":\"twitch\",\"username\":\"clavicular\",\"url\":\"https:\\/\\/www.twitch.tv\\/clavicular\",\"isLive\":false,\"lastChecked\":1770062497494}],\"addedAt\":0,\"lastChecked\":1770062497494},{\"id\":\"thebenjishow-1\",\"name\":\"The Benji Show\",\"bio\":\"Hilarious skits and comedy bits.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=The%20Benji%20Show\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Hilarious Skits\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"COMEDY\",\"SKITS\"],\"accounts\":[{\"id\":\"thebenjishow-tiktok\",\"platform\":\"tiktok\",\"username\":\"thebenjishow\",\"url\":\"https:\\/\\/www.tiktok.com\\/@thebenjishow\",\"isLive\":false,\"lastChecked\":1770062498125}],\"addedAt\":0,\"lastChecked\":1770062498125},{\"id\":\"zarthestar-1\",\"name\":\"Zarthestar\",\"bio\":\"Cosmic content creator. TikTok comedy & lifestyle.\",\"avatarUrl\":\"https:\\/\\/api.dicebear.com\\/7.x\\/pixel-art\\/svg?seed=Zarthestar\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"zarthestar-tiktok\",\"platform\":\"tiktok\",\"username\":\"zarthestarcomedy\",\"url\":\"https:\\/\\/www.tiktok.com\\/@zarthestarcomedy\",\"followers\":\"125K\",\"isLive\":false,\"lastChecked\":1770062498666}],\"addedAt\":0,\"lastChecked\":1770062498666},{\"id\":\"3\",\"name\":\"Adin Ross\",\"bio\":\"Kick\'s No. 1 Creator | Live every day.\",\"avatarUrl\":\"https:\\/\\/files.kick.com\\/images\\/user\\/904404\\/profile_image\\/conversion\\/e344be03-aff2-4791-ae5a-22a9ac4cf89a-fullsize.webp\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"\",\"note\":\"\",\"tags\":[],\"accounts\":[{\"id\":\"3a\",\"platform\":\"kick\",\"username\":\"adinross\",\"url\":\"https:\\/\\/kick.com\\/adinross\",\"followers\":\"1.9M\",\"isLive\":false,\"lastChecked\":1770062499210},{\"id\":\"3b\",\"platform\":\"youtube\",\"username\":\"adinross\",\"url\":\"https:\\/\\/youtube.com\\/@adinross\",\"followers\":\"4.6M\",\"lastChecked\":1770062499210}],\"addedAt\":0,\"lastChecked\":1770062499210},{\"id\":\"6\",\"name\":\"Starfireara\",\"bio\":\"Content creator and visionary.\",\"avatarUrl\":\"\\/fc\\/avatars\\/starfireara.jpg\",\"isFavorite\":true,\"isPinned\":true,\"category\":\"Favorites\",\"reason\":\"Motivational speaker\",\"note\":\"test eltons testing on february 2 2026 XYZ DRAGON!\",\"tags\":[],\"accounts\":[{\"id\":\"6b\",\"platform\":\"tiktok\",\"username\":\"starfireara\",\"url\":\"https:\\/\\/www.tiktok.com\\/@starfireara\",\"followers\":\"247.3K\",\"isLive\":false,\"lastChecked\":1770062515968},{\"id\":\"starfireara-linktree\",\"platform\":\"other\",\"username\":\"linktr.ee\\/starfiire\",\"url\":\"https:\\/\\/linktr.ee\\/starfiire\",\"lastChecked\":1770062515968}],\"addedAt\":0,\"lastChecked\":1770062515968,\"secondaryNote\":\"testing 123\\nwww.google.com\"},{\"id\":\"chavcriss-1\",\"name\":\"Chavcriss\",\"bio\":\"Fitness and comedy influencer.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/chavcriss\",\"isFavorite\":true,\"isPinned\":false,\"category\":\"Fitness\",\"reason\":\"Fitness & comedy inspiration.\",\"note\":\"\",\"tags\":[\"FITNESS\",\"COMEDY\"],\"accounts\":[{\"id\":\"chavcriss-tiktok\",\"platform\":\"tiktok\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.tiktok.com\\/@chavcriss\",\"isLive\":false,\"lastChecked\":1770062516527},{\"id\":\"chavcriss-youtube\",\"platform\":\"youtube\",\"username\":\"chavcriss\",\"url\":\"https:\\/\\/www.youtube.com\\/@chavcriss\",\"lastChecked\":1770062516527}],\"addedAt\":0,\"lastChecked\":1770062516527},{\"id\":\"jubalfresh-1\",\"name\":\"Jubal Fresh\",\"bio\":\"Prank phone calls and radio bits.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/youtube\\/jubalfresh\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Prank Phone Calls\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"COMEDY\"],\"accounts\":[{\"id\":\"jubalfresh-youtube\",\"platform\":\"youtube\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.youtube.com\\/@jubalfresh\",\"lastChecked\":1770062517068},{\"id\":\"jubalfresh-tiktok\",\"platform\":\"tiktok\",\"username\":\"jubalfresh\",\"url\":\"https:\\/\\/www.tiktok.com\\/@jubalfresh\",\"isLive\":false,\"lastChecked\":1770062517068}],\"addedAt\":0,\"lastChecked\":1770062517068},{\"id\":\"brooke-and-jeffrey-1\",\"name\":\"Brooke & Jeffrey\",\"bio\":\"Phone Tap archives and prank call segments.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/https%3A%2F%2Fwww.brookeandjeffrey.com%2Ffeatured%2Fphone-tap-bjitm%2F\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Other Content\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"PRANK CALLS\",\"RADIO\"],\"accounts\":[{\"id\":\"brooke-and-jeffrey-phone-tap\",\"platform\":\"other\",\"username\":\"brookeandjeffrey.com\",\"url\":\"https:\\/\\/www.brookeandjeffrey.com\\/featured\\/phone-tap-bjitm\\/\",\"lastChecked\":1770062517599}],\"addedAt\":0,\"lastChecked\":1770062517599},{\"id\":\"clip2prankmain-1\",\"name\":\"Clip2prankmain\",\"bio\":\"TikTok creator.\",\"avatarUrl\":\"https:\\/\\/unavatar.io\\/tiktok\\/clip2prankmain\",\"isFavorite\":false,\"isPinned\":false,\"category\":\"Entertainment\",\"reason\":\"\",\"note\":\"\",\"tags\":[\"LOVE THEIR CONTENT\"],\"accounts\":[{\"id\":\"clip2prankmain-tiktok\",\"platform\":\"tiktok\",\"username\":\"clip2prankmain\",\"url\":\"https:\\/\\/www.tiktok.com\\/@clip2prankmain\",\"isLive\":false,\"lastChecked\":1770062518102}],\"addedAt\":0,\"lastChecked\":1770062518102},{\"id\":\"brunitarte-tiktok\",\"name\":\"Brunitarte\",\"bio\":\"\",\"avatarUrl\":\"\",\"category\":\"other\",\"reason\":\"\",\"tags\":[],\"accounts\":[{\"platform\":\"tiktok\",\"username\":\"brunitarte\",\"url\":\"https:\\/\\/www.tiktok.com\\/@brunitarte\"}],\"isFavorite\":false,\"isPinned\":false}]', '2026-02-03 02:11:15');

-- --------------------------------------------------------

--
-- Table structure for table `user_notes`
--

CREATE TABLE `user_notes` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `creator_id` varchar(100) NOT NULL,
  `note` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_notes`
--

INSERT INTO `user_notes` (`id`, `user_id`, `creator_id`, `note`, `updated_at`) VALUES
(1, 1, '6', 'herbtest123', '2026-02-01 02:37:33'),
(2, 2, '6', 'test eltons testing on february 2 2026 XYZ DRAGON! test', '2026-02-02 21:46:42'),
(3, 2, '3b364cd8-0c4e-47ac-8b81-c3818288b122', 'makeup creator/funny stories', '2026-02-02 19:06:49'),
(4, 2, 'brunitarte-tiktok', 'test', '2026-02-02 23:14:25');

-- --------------------------------------------------------

--
-- Table structure for table `user_saved_events`
--

CREATE TABLE `user_saved_events` (
  `user_id` int NOT NULL,
  `event_id` varchar(255) NOT NULL,
  `event_data` longtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_saved_events`
--

INSERT INTO `user_saved_events` (`user_id`, `event_id`, `event_data`, `created_at`) VALUES
(2, '30c3147c0190f950276018696306388f', '{\"id\":\"30c3147c0190f950276018696306388f\",\"title\":\"New Years Mood Board and Valentine Making\",\"date\":\"2026-02-02T19:00:00-05:00\",\"endDate\":\"2026-02-02T19:00:00-05:00\",\"location\":\"Toronto Metropolitan University Student Centre\",\"source\":\"Eventbrite\",\"host\":\"Various Organizers\",\"url\":\"https:\\/\\/www.eventbrite.com\\/e\\/new-years-mood-board-and-valentine-making-tickets-1980474875666\",\"image\":\"https:\\/\\/img.evbuc.com\\/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1174743324%2F842950837393%2F1%2Foriginal.20260113-161539?w=512&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C107%2C1104%2C552&s=04350e16e0f477b1661a01df09b616d6\",\"price\":\"See tickets\",\"isFree\":false,\"description\":\"Join the TMU Print and Zine Club on February 3rd for some New Year\'s goal setting and Valentine\'s!\",\"latitude\":43.6577117,\"longitude\":-79.3782652,\"categories\":[\"Nightlife\"],\"status\":\"UPCOMING\",\"lastUpdated\":\"2026-01-26T16:04:02.006Z\",\"tags\":[\"Nightlife\"]}', '2026-02-02 23:41:52');

-- --------------------------------------------------------

--
-- Table structure for table `user_secondary_notes`
--

CREATE TABLE `user_secondary_notes` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `creator_id` varchar(64) NOT NULL,
  `secondary_note` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_secondary_notes`
--

INSERT INTO `user_secondary_notes` (`id`, `user_id`, `creator_id`, `secondary_note`, `updated_at`) VALUES
(1, 2, '6', 'testing 123\nwww.google.com', '2026-02-02 19:29:06');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `creators`
--
ALTER TABLE `creators`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `creator_defaults`
--
ALTER TABLE `creator_defaults`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `creator_id` (`creator_id`);

--
-- Indexes for table `favcreatorslogs`
--
ALTER TABLE `favcreatorslogs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_email` (`user_email`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_link_lists`
--
ALTER TABLE `user_link_lists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_list_name` (`user_id`,`list_name`);

--
-- Indexes for table `user_lists`
--
ALTER TABLE `user_lists`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_notes`
--
ALTER TABLE `user_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_creator` (`user_id`,`creator_id`);

--
-- Indexes for table `user_saved_events`
--
ALTER TABLE `user_saved_events`
  ADD PRIMARY KEY (`user_id`,`event_id`);

--
-- Indexes for table `user_secondary_notes`
--
ALTER TABLE `user_secondary_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_creator_secondary` (`user_id`,`creator_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `creator_defaults`
--
ALTER TABLE `creator_defaults`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `favcreatorslogs`
--
ALTER TABLE `favcreatorslogs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_link_lists`
--
ALTER TABLE `user_link_lists`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_notes`
--
ALTER TABLE `user_notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_secondary_notes`
--
ALTER TABLE `user_secondary_notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
