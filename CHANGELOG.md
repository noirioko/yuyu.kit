# Changelog

All notable changes to MyPebbles will be documented in this file.

---

## [2025-12-23]

### Added
- **Pricing Page** (`/pricing`) - New permanent subscription page with:
  - Free Sprout tier (50 assets, 3 projects, 5 collections)
  - Zen Gardener (IDR 199,000/year) - unlimited everything
  - Zen Castle (IDR 399,000 lifetime) - best value, pay once forever
  - FAQ section and contact support link
  - Lemon Squeezy checkout integration

- **Sales Page** (`/sales`) - View ACON3D sale matches:
  - Shows wishlist items that are currently on sale
  - Manually marked "on sale" items grouped by platform
  - Direct links to purchase

- **Support Page** (`/support`) - FAQ and help resources

- **Multi-page ACON Sale Scraping** - Extension now scrapes ALL pages of ACON sales (up to 20 pages)
  - Background sync with progress bar
  - Split button UI: [Check ACON Sales] [Visit Page]
  - No more opening sale page in user's face

- **Tag Deletion** - Can now delete tags from "Browse by Tag" page (hover to see × button)

- **Projects vs Collections FAQ** - Added to About page explaining they work the same, just organized differently

- **Discount Percentage Dropdown** - Add/Edit modals now have quick select for common discounts (10%, 20%, 30%, etc.)

- **Collection Limit Enforcement** - Free tier now limited to 5 collections (was unlimited)

### Changed
- Updated free tier limits: 50 assets, 3 projects, 5 collections
- Fixed wording: "save first, then edit" instead of "edit before saving"
- Moved edit/delete buttons on asset cards from top-right to bottom-right (avoids sale badge overlap)
- Added Pricing link to Dashboard profile menu and Landing page footer

### Fixed
- Sale badge no longer covers edit/trash icons on Dashboard
- Extension popup wording corrected for save-then-edit workflow

---

## Earlier Updates
(Pre-changelog period - features developed iteratively)

- Initial release with core asset management
- Browser extension for ACON3D, CSP, Gumroad, itch.io, Booth, Unity, Sketchfab, Amazon
- Projects, Collections, Tags organization
- Day/Night theme modes
- Google authentication
- Firebase real-time sync
