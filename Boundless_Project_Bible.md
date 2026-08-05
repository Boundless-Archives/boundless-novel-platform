# Boundless Novel Platform — Project Bible

*Last Updated: August 2026*

---

# 1. Project Vision

**Boundless** is a community-driven online novel platform designed to give both readers and writers a polished experience without unnecessary complexity.

The platform focuses on:

* Beautiful reading experience
* Powerful but distraction-free writing tools
* Community interaction
* Long-term scalability

The philosophy behind the project is:

> **Build an excellent Version 1 first. Expand afterwards.**

No feature is added unless it directly improves the core reading or writing experience.

---

# 2. Technology Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript

## Backend

* Supabase

  * Authentication
  * PostgreSQL Database
  * Storage
  * Row Level Security

## Hosting

* Vercel

## Rich Text Editor

* Lexical

---

# 3. Development Philosophy

The project follows several strict rules.

### Vertical Slice Development

One feature is completed fully before another begins.

Example:

Story Creation

↓

Story Editing

↓

Story Reading

↓

Story Drafts

NOT

Story Creation

↓

Analytics

↓

Notifications

↓

Comments

↓

Back to Story Editing

---

### Avoid Feature Creep

If a feature is not necessary for Version 1, it is postponed.

---

### Keep Architecture Stable

Large refactors are avoided during V1.

Instead:

* finish the feature
* test it
* polish later

---

# 4. Completed Features

---

## Authentication

* User registration
* Login
* Logout

---

## Profiles

* User profile creation
* Reader / Author status

---

## Story System

* Story creation
* Story editing
* Story dashboard
* Story cover uploads
* Story descriptions
* Story status

Current story statuses:

* Draft
* Ongoing
* Completed
* Hiatus
* Dropped

---

## Story Rules

Implemented:

* Story titles must be globally unique.
* Slugs generated automatically.
* Draft stories hidden from public homepage.
* Draft stories cannot be accessed publicly.

---

## Chapter System

Completed:

* Create chapters
* Edit chapters
* Preview chapters
* Chapter dashboard

### Chapter Drafts

Implemented

Each chapter now supports:

* Draft
* Published

A chapter draft:

* appears inside author dashboard
* is hidden from readers
* can be edited safely

Published chapters become publicly visible.

---

## Rich Text Editor (Lexical)

Successfully migrated from the original editor.

Current editor supports:

### Text Formatting

* Bold
* Italic
* Underline

### Block Formatting

* Paragraph
* Heading 1
* Heading 2
* Heading 3

### Lists

* Bullet List
* Numbered List

### Special Blocks

* Quote
* Code Block

### History

* Undo
* Redo

### Storage

Editor stores HTML inside Supabase.

Reader pages correctly render stored HTML using:

* dangerouslySetInnerHTML

Editor pipeline is now complete:

Lexical

↓

HTML

↓

Supabase

↓

Reader

---

## Reading Experience

Completed:

* Chapter reader
* Previous / Next chapter navigation
* Story page
* Chapter comments
* Reviews
* Likes
* Save Story
* Reading History

---

## Recommendation System (Version 1)

Implemented

Readers receive recommendations based on shared genres.

---

# 5. Deferred Features

These are intentionally postponed until after Version 1.

Editor:

* Toolbar overflow (⋯ menu on mobile)
* Slash Commands
* Floating Selection Toolbar
* Horizontal Rule
* Advanced keyboard shortcuts
* Tables
* Images inside chapters

General:

* Notification system
* Followers
* Offline reading
* AI writing tools

---

# 6. Current Roadmap (Version 1.8)

Current development order:

## 1.

Simplified Publishing

Goal:

Allow writers to publish chapter drafts directly from the Edit Chapter page.

---

## 2.

Story Analytics

Planned metrics:

* Views
* Reads
* Likes
* Saves
* Ratings
* Followers (future)

---

## 3.

Author Series

Allow authors to group stories together.

Example:

The Abyss Saga

* Book I
* Book II
* Book III

---

## 4.

Reader Collections

Personal bookshelf organization.

Examples:

* Favorites
* Reading Later
* Horror Collection

---

## 5.

Library Revamp

Better organization.

Filtering.

Sorting.

Recommendations.

Continue Reading.

---

## 6.

Genre Discovery Pages

Dedicated landing pages for each genre.

Examples:

/genre/fantasy

/genre/horror

/genre/romance

Each page becomes its own discovery hub.

---

# 7. Planned Future Versions

After Version 1

* Progressive Web App
* Capacitor Android App
* Native Mobile Application
* Advanced Recommendation Engine
* Followers
* Notifications
* Editor/Admin roles
* AI Assistance
* Monetization
* Premium Features
* Reading Statistics
* Achievements
* Community Events

---

# 8. Git Workflow

Every completed feature follows:

1.

Finish implementation

↓

2.

Test thoroughly

↓

3.

Commit

↓

4.

Push to GitHub

↓

5.

Deploy to Vercel

---

# 9. Design Philosophy

Boundless should always feel:

* Clean
* Modern
* Fast
* Reader-first
* Writer-friendly

Every screen should reduce friction.

---

# 10. AI Collaboration Rules

The project is being developed collaboratively with AI.

Key principles:

* Maintain architectural consistency.
* Avoid unnecessary rewrites.
* Finish existing systems before introducing new ones.
* Preserve backward compatibility whenever possible.
* Update this Project Bible after every major milestone.

---

# 11. Current Project Status

Current Version:

**Version 1.8**

Overall Progress:

* Core Platform: ✅
* Story System: ✅
* Chapter System: ✅
* Rich Text Editor: ✅
* Public Reading Experience: ✅
* Chapter Draft System: ✅
* Simplified Publishing: 🔄 In Progress
* Analytics: ⏳ Pending
* Series: ⏳ Pending
* Collections: ⏳ Pending
* Library Revamp: ⏳ Pending
* Genre Discovery: ⏳ Pending

---

# Final Guiding Principle

> Build a platform that feels complete before it feels large.

Every completed feature should be polished enough that users could comfortably use it today, while the architecture remains flexible enough to support the much larger vision for Boundless in the future.
