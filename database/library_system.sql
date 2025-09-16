-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 05, 2025 at 11:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `library_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `account_id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `cp_number` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `book_id` int(10) UNSIGNED NOT NULL,
  `name_of_book` varchar(255) NOT NULL,
  `added_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `borrowed`
--

CREATE TABLE `borrowed` (
  `borrow_id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED NOT NULL,
  `book_id` int(10) UNSIGNED NOT NULL,
  `librarian_id` int(10) UNSIGNED NOT NULL,
  `borrowed_date` date NOT NULL,
  `due_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `home_content`
--

CREATE TABLE `home_content` (
  `content_id` int(10) UNSIGNED NOT NULL,
  `intro` text DEFAULT NULL,
  `policy` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `librarians`
--

CREATE TABLE `librarians` (
  `librarian_id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `cp_number` varchar(20) NOT NULL,
  `gmail` varchar(150) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `reset_id` int(10) UNSIGNED NOT NULL,
  `librarian_id` int(10) UNSIGNED NOT NULL,
  `reset_token` varchar(255) NOT NULL,
  `expiry` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account_id`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`book_id`),
  ADD KEY `added_by` (`added_by`);

--
-- Indexes for table `borrowed`
--
ALTER TABLE `borrowed`
  ADD PRIMARY KEY (`borrow_id`),
  ADD KEY `idx_borrowed_account` (`account_id`),
  ADD KEY `idx_borrowed_book` (`book_id`),
  ADD KEY `idx_borrowed_librarian` (`librarian_id`);

--
-- Indexes for table `home_content`
--
ALTER TABLE `home_content`
  ADD PRIMARY KEY (`content_id`);

--
-- Indexes for table `librarians`
--
ALTER TABLE `librarians`
  ADD PRIMARY KEY (`librarian_id`),
  ADD UNIQUE KEY `gmail` (`gmail`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`reset_id`),
  ADD UNIQUE KEY `uq_reset_token` (`reset_token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `account_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `book_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `borrowed`
--
ALTER TABLE `borrowed`
  MODIFY `borrow_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `home_content`
--
ALTER TABLE `home_content`
  MODIFY `content_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `librarians`
--
ALTER TABLE `librarians`
  MODIFY `librarian_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `reset_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `books`
--
ALTER TABLE `books`
  ADD CONSTRAINT `books_ibfk_1` FOREIGN KEY (`added_by`) REFERENCES `librarians` (`librarian_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `borrowed`
--
ALTER TABLE `borrowed`
  ADD CONSTRAINT `fk_borrowed_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_borrowed_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_borrowed_librarian` FOREIGN KEY (`librarian_id`) REFERENCES `librarians` (`librarian_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
