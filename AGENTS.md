Non-superadmin education administrators see only Leerlingen & contacten and Leerling-aanmeldingen; keep navigation and route gating aligned so hidden pages cannot be opened via direct links.
Education directory and registration changes are captured by database triggers, not browser calls, so edits through every client path leave a trustworthy trail; only mosque superadmins may read the audit trail.
Sort education classes through the shared Arabic-label comparator so preparatory أ and ب precede grades 1–6 even when labels have different prefixes.
Convert-committee access is per tenant via convert_committee_members + is_convert_committee(); files live under <tenant_id>/ in the private convert-certificates bucket so storage RLS can scope by folder.
Expose the convert-committee workspace as its own superadmin route instead of nesting it inside the sermon uploader, so education access does not hide it.
Normalize sermon text with the shared sermonText helper at entry and rendering so pasted Markdown headings never leak into generated PDFs.
Store optional crowdfunding campaign content in the project record and edit it in project management; render through the shared campaign page while preserving the legacy layout and Mollie donation flow for existing projects.
Resolve campaign photos through the shared campaignImages helper and render auto-rotation through CampaignSlideshow so campaign and listing imagery stay consistent while honoring newly edited galleries.
Settle crowdfunding payments atomically through a service-role-only function so repeated webhooks never count a donation twice; return pages must read stored payment status, not trust URL flags.
Give shareable campaign links their own social preview through the build-time campaignShareHtml plugin, which writes a static HTML copy per campaign route; crawlers don't run JavaScript and the app has no server rendering.
