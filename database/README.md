# Database Setup Guide

This directory contains the consolidated database setup scripts for the Portfolio Management SaaS.

## 🚀 Quick Start

To set up or reset your Supabase database, simply run the master script:

### `master_setup.sql`
This single file contains the **entire** database definition, including:
1.  **Schema:** All tables (`case_studies`, `user_profiles`, `assets`, etc.).
2.  **SaaS Logic:** The `portfolio_snapshots` table and `is_published` columns.
3.  **Security (RLS):** Row Level Security policies enforcing "Public Read / Owner Write" and the strict SaaS visibility rules (Content is only public if the Portfolio is published).
4.  **Functions (RPC):** The `publish_portfolio` and `unpublish_portfolio` stored procedures that manage the live/draft state.

**How to run:**
1.  Open your Supabase Project Dashboard.
2.  Go to the **SQL Editor**.
3.  Copy the content of `database/master_setup.sql`.
4.  Paste it into the editor and click **Run**.

## 📂 Folder Structure

*   **`master_setup.sql`**: The authoritative source of truth for the database schema. Use this for new deployments.
*   **`archive/`**: Contains older migration scripts and partial fixes used during development. You can ignore these unless you need to debug historical changes.

## 🛡️ Security Note
The RLS policies in `master_setup.sql` are configured for a SaaS environment.
*   **Authenticated Users:** Can create and edit their own data (linked by `org_id`).
*   **Public Users (Anonymous):** Can ONLY read data where:
    *   `user_profiles.portfolio_status = 'published'`
    *   AND `[table].is_published = true` (for granular items like case studies).
